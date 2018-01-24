/**
 * Copyright (c) 2013-2018, OVH SAS.
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 * 
 *   * Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 *   * Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 *   * Neither the name of OVH SAS nor the
 *     names of its contributors may be used to endorse or promote products
 *     derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY OVH SAS AND CONTRIBUTORS ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL OVH SAS AND CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

'use strict';

const util = require('util');
const stream = require('stream');
const concat = require('concat-stream');
const configuration = require('@rduk/configuration');
const logger = require('@rduk/logger');
const Base = require('ovh-iconlib-provider-storage/lib/base');
const pkgcloud = require('pkgcloud');

let Provider = function Provider(config) {
    Provider.super_.call(this, config);
};

util.inherits(Provider, Base);

Provider.prototype.initialize = function() {
    if (!this.config.connection) {
        throw new Error('invalid storage configuration.');
    }

    let connection = configuration.load().connections.get(this.config.connection);
    this.client = pkgcloud.storage.createClient({
        provider: 'openstack',
        authUrl: connection.authUrl,
        username: connection.username,
        password: connection.password,
        region: connection.region
    });
    
    this.container = {
        name: connection.container
    };

    logger.debug('OpenStask storage provider initialized');
};

/**
 * Lists files in the specified path
 * @param {String} path Path to list (default: '', get files in root path)
 * @param {Number} skip Number of elements to skip (default: 0)
 * @param {Number} take Number of elements to take (default: 10)
 * @return {Promise}
 */
Provider.prototype.list = function(path, skip, take) {
    logger.info('Pkgcloud openstack storage implementation doesn\'t manage pagination and filtering by path');
    logger.info('Will be done programmatically, if needed');

    path = path || '';
    skip = skip || 0;
    take = take || 10;

    return new Promise((resolve, reject) => {
        logger.debug('get files');
        this.client.getFiles(this.container.name, function(err, files) {
            return !!err ? 
                reject(err) : 
                resolve(files);
        });
    })
    .then(function(files) {
        logger.debug(`filtering files according the path ('${path}')`);
        if (!path) {
            return files.filter(f => (f.name.indexOf('/') < 0));
        }

        return files.filter(f => (f.name.startsWith(`${path}/`)));
    })
    .then(function(files) {
        logger.debug(`pagination: take ${take} elements from index ${skip}`);
        return files.slice(skip, skip + take);
    });
};

/**
 * Upload file
 * @param {Stream} stream 
 * @param {Object} options 
 * @return {Promise}
 */
Provider.prototype.upload = function(file, options) {
    if (!file || file instanceof stream.Readable !== true) {
        throw new Error('file parameter is mandatory and of type stream.Readable');
    }

    if (!options || !options.name) {
        throw new Error('options.name parameter is mandatory');
    }

    return new Promise((resolve, reject) => {
        let writeStream = this.client.upload({
            container: this.container.name,
            remote: options.name
        });

        writeStream.on('error', reject);

        let promise = new Promise(function(resolveConcat) {
            writeStream.on('success', function(file) {
                promise.then(function(data) {
                    resolve({
                        name: file.name,
                        size: file.size,
                        buffer: data
                    });
                });
            });

            file.pipe(writeStream).pipe(concat(function(data) {
                resolveConcat(data);
            }));
        });
    });
};

/**
 * Download file
 * @param {String} filename 
 * @param {Function} callback 
 * @return {Stream}
 */
Provider.prototype.download = function(filename, callback) {
    if (!filename) {
        throw new Error('parameter filename is mandatory');
    }

    return this.client.download({
        container: this.container.name,
        remote: filename
    }, callback);
};

/**
 * Delete file
 * @param {String} filepath
 * @return {Promise}
 */
Provider.prototype.remove = function(filename) {
    return new Promise((resolve, reject) => {
        this.client.removeFile(this.container.name, filename, (err, result) => {
            return !!err ? 
                reject(err) : 
                resolve(result);
        });
    });
};

module.exports = Provider;
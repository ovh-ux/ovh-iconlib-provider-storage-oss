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

const fs = require('fs');
const stream = require('stream');
const errors = require('rduk-errors');
const Provider = require('../lib');

describe('storage provider', function() {

    describe('(oss implementation)', function() {
        let provider;

        beforeEach(function(){
            provider = new Provider({
                name: 'test',
                connection: 'test'
            });
        });

        describe('initialization without connection', function() {
            it('shoud throw an Error', () => {
                expect(() => {
                    new Provider({name: 'test'});
                }).toThrowError(Error);
            });
        });

        describe('method list, when called,', function() {
            it('should return an array of files', function(done) {
                spyOn(provider.client, "getFiles").and.callFake((container, cb) => { cb(null, []); });
                provider.list()
                    .then(files => {
                        expect(files).toBeDefined();
                        expect(Array.isArray(files)).toBe(true);
                        done();
                    })
                    .catch(err => {
                        //if here, something went wrong.
                        expect(err).toBeUndefined();
                        done();
                    });
            });
        });

        describe('When an unexpected error occured during the listing of a directory', () => {
            it('should reject the promise', done => {
                spyOn(provider.client, "getFiles").and.callFake((container, cb) => { cb(new Error('unexpectedError')); });
                provider.list()
                    .then(files => {
                        //if here, something went wrong.
                        expect(files).toBeUndefined();
                        done();
                    })
                    .catch(err => {
                        expect(err).toBeDefined();
                        done();
                    });
            });
        });

        describe('upload a file', () => {

            describe('with invalid file', () => {
                it('should throw an Error', () => {
                    expect(function() {
                        provider.upload(null);
                    }).toThrowError(Error);

                    expect(function() {
                        provider.upload({});
                    }).toThrowError(Error);
                });
            });

            describe('with invalid options.name', () => {
                it('should throw an Error', () => {
                    let file = stream.PassThrough();
                    file.end('dummy content');

                    expect(function() {
                        provider.upload(file, null);
                    }).toThrowError(Error);

                    expect(function() {
                        provider.upload(file, {});
                    }).toThrowError(Error);
                });
            });

            describe('with valid parameters', () => {
                it('should success', done => {
                    let dummyStream = new stream.Transform()
                    dummyStream._transform = function(chunk, encoding, done) {
                        this.push(chunk);
                        done();
                    }
                    dummyStream.on('finish', function() {
                        this.emit('success', {});
                    });
                    spyOn(provider.client, "upload").and.returnValue(dummyStream);
                    let file = stream.PassThrough();
                    file.end('dummy content');
                    provider.upload(file, {name: 'dummy.txt'})
                        .then(result => {
                            expect(result).toBeDefined();
                            done();
                        })
                        .catch(err => {
                            //if here, something went wrong.
                            expect(err).toBeUndefined();
                            done();
                        });
                });
            });

        });

        describe('calling method download', () => {

            describe('with invalid parameter filename', function() {
                it('should throw an Error', () => {
                    expect(() => {
                        provider.download();
                    }).toThrowError(Error);
                });
            });

            describe('with valid parameter filename', () => {
                it('should success', done => {
                    spyOn(provider.client, "download").and.callFake((options, cb) => { cb(null, {}); });
                    provider.download('dummy.txt')
                        .then(result => {
                            expect(result).toBeDefined();
                            done();
                        })
                        .catch(err => {
                            //if here, something went wrong.
                            expect(err).toBeUndefined();
                            done();
                        });
                });
            });

            describe('When an unexpected error occured during the download', () => {
                it('should reject the promise', done => {
                    spyOn(provider.client, "download").and.callFake((options, cb) => { cb(new Error('unexpected error')); });
                    provider.download('dummy.txt')
                        .then(result => {
                            //if here, something went wrong.
                            expect(result).toBeUndefined();
                            done();
                        })
                        .catch(err => {
                            expect(err).toBeDefined();
                            done();
                        });
                });
            });

        });

        describe('When an unexpected error occured during the upload of a file', () => {
            it('should reject the promise', done => {
                let dummyStream = new stream.Transform()
                dummyStream._transform = function(chunk, encoding, done) {
                    this.push(chunk);
                    done();
                }
                dummyStream.on('finish', function() {
                    this.emit('error', new Error('unexpected error'));
                });
                spyOn(provider.client, "upload").and.returnValue(dummyStream);
                let file = stream.PassThrough();
                file.end('dummy content');
                provider.upload(file, {name: 'dummy.txt'})
                    .then(result => {
                        //if here, something went wrong.
                        expect(result).toBeUndefined();
                        done();
                    })
                    .catch(err => {
                        expect(err).toBeDefined();
                        done();
                    });
            });
        });

        describe('removing a file', () => {
            it('should success', done => {
                spyOn(provider.client, "removeFile").and.callFake((container, file, cb) => { cb(null, true); });
                provider.remove('ddos-protect.svg')
                    .then(result => {
                        expect(result).toBe(true);
                        done();
                    })
                    .catch(err => {
                        //if here, something went wrong.
                        expect(err).toBeUndefined();
                        done();
                    });
            });
        });

        describe('When an unexpected error occured during the deletion of a file', () => {
            it('should reject the promise', done => {
                spyOn(provider.client, "removeFile").and.callFake((container, file, cb) => { cb(new Error()); });
                provider.remove('ddos-protect.svg')
                    .then(result => {
                        //if here, something went wrong.
                        expect(result).toBeUndefined();
                        done();
                    })
                    .catch(err => {
                        expect(err).toBeDefined();
                        done();
                    });
            });
        });

    });

});

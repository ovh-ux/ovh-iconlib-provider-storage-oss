# Icon Library - OpenStack Storage

[![Build Status](https://travis-ci.org/ovh-ux/ovh-iconlib-provider-storage-oss.svg?branch=master)](https://travis-ci.org/ovh-ux/ovh-iconlib-provider-storage-oss)
[![Coverage Status](https://coveralls.io/repos/github/ovh-ux/ovh-iconlib-provider-storage-oss/badge.svg?branch=master)](https://coveralls.io/github/ovh-ux/ovh-iconlib-provider-storage-oss?branch=master)

[![NPM](https://nodei.co/npm/ovh-iconlib-provider-storage-oss.png)](https://nodei.co/npm/ovh-iconlib-provider-storage-oss/)

this module is an implementation of the [base storage provider](https://github.com/ovh-ux/ovh-iconlib-provider-storage).

it uses the [openstack](https://www.openstack.org/) part of [pkgcloud](https://www.npmjs.com/package/pkgcloud).

## Installation

[`ovh-iconlib-provider-storage`](https://github.com/ovh-ux/ovh-iconlib-provider-storage) is a peer dependency.

```sh
npm install --save ovh-iconlib-provider-storage ovh-iconlib-provider-storage-oss
```

## Configuration

```yaml
# config.yml
---
connections:
    -
        name: test
        authUrl: ${OSS_AUTH_URL} # process.env.OSS_AUTH_URL
        username: ${OSS_USERNAME} # process.env.OSS_USERNAME
        password: ${OSS_PASSWORD} # process.env.OSS_PASSWORD
        region: ${OSS_REGION} # process.env.OSS_REGION
        container: ${OSS_CONTAINER} # process.env.OSS_CONTAINER
storage:
   default: oss
   providers:
     -
       name: oss
       type: ovh-iconlib-provider-storage-oss
       connection: test
```

## Usage

```js
// default provider instance loaded according to the configuration
const storage = require('ovh-iconlib-provider-storage').getInstance(); 
```

```js
// list 10 files from path/to/list
storage.list('path/to/list', 10, 10)
    .then(files => {
        files.forEach(file =>  {
            ...
        });
    });
```

```js
// upload file
let stream = ...;
storage.upload(stream, {name: 'example.txt'})
    .then(fileInfo => {
        ...
    });
```

```js
// remove file
storage.remove('example.txt')
    .then(removed => {
        ...
    });
```

```js
// download file (get a readable stream)
let stream = storage.download('example.txt');
```

## License

See [`LICENSE`](LICENSE) file

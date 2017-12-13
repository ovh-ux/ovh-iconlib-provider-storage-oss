# Icon Library - OpenStack Storage

[![Build Status](https://travis-ci.org/ovh-ux/ovh-iconlib-provider-storage-oss.svg?branch=master)](https://travis-ci.org/ovh-ux/ovh-iconlib-provider-storage-oss)
[![Coverage Status](https://coveralls.io/repos/github/ovh-ux/ovh-iconlib-provider-storage-oss/badge.svg?branch=master)](https://coveralls.io/github/ovh-ux/ovh-iconlib-provider-storage-oss?branch=master)
[![NPM](https://nodei.co/npm/ovh-iconlib-provider-storage-oss.png)](https://nodei.co/npm/ovh-iconlib-provider-storage-oss/)

this module is an implementation of the [base storage provider](https://github.com/ovh-ux/ovh-iconlib-provider-storage)

## Installation

```bash
npm install --save "https://github.com/ovh-ux/ovh-iconlib-provider-storage" "https://github.com/ovh-ux/ovh-iconlib-provider-storage-oss"
```

## Configuration

```yaml
# config.yml
---
connections:
    -
        name: test
        authUrl: ${OSS_AUTH_URL}
        username: ${OSS_USERNAME}
        password: ${OSS_PASSWORD}
        region: ${OSS_REGION}
        container: ${OSS_CONTAINER}
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
// get files
storage.list()
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

## License

See [`LICENSE`](LICENSE) file

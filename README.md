connection-string
=================

URL Connection String Parser - _for all browsers and Node.js versions._

[![Build Status](https://travis-ci.org/vitaly-t/connection-string.svg?branch=master)](https://travis-ci.org/vitaly-t/connection-string)
[![Coverage Status](https://coveralls.io/repos/vitaly-t/connection-string/badge.svg?branch=master)](https://coveralls.io/r/vitaly-t/connection-string?branch=master)

Takes a URL connection string: 

```
protocol://user:password@hostname:port/segment1/segment2?param1=value1&param2=value2
```

and converts it into an object:

```js
{
    protocol: 'protocol',
    user: 'user',
    password: 'password',
    host: 'hostname:port',
    hostname: 'hostname',
    port: 'port',
    segments: ['segment1', 'segment2'],
    params: {
        param1: 'value1',
        param2: 'value2'
    }
}
```

## Installing

```
$ npm install connection-string
```

## Loading

* **Node.js**

```js
var parse = require('connection-string');
```

* **Browser**

```html
<script src="./connection-string"></script>

<script>
    // function parseConnectionString is available here
</script>
```

## Usage

See [Wiki Examples](https://github.com/vitaly-t/connection-string/wiki).

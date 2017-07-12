connection-string
=================

URL Connection String Parser: for all browsers + Node.js versions.

[![Build Status](https://travis-ci.org/vitaly-t/connection-string.svg?branch=master)](https://travis-ci.org/vitaly-t/connection-string)
[![Coverage Status](https://coveralls.io/repos/vitaly-t/connection-string/badge.svg?branch=master)](https://coveralls.io/r/vitaly-t/connection-string?branch=master)

Parses connection parameters from a URL string: 

```
protocol://user:password@hostname:port/segment1/segment2?param1=value1&param2=value2
```

and into an object:

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

**NOTE: This project is under development, not ready for use yet.**

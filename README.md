connection-string
=================

URL Connection String Parser, with fully optional syntax.

[![Build Status](https://travis-ci.org/vitaly-t/connection-string.svg?branch=master)](https://travis-ci.org/vitaly-t/connection-string)
[![Coverage Status](https://coveralls.io/repos/vitaly-t/connection-string/badge.svg?branch=master)](https://coveralls.io/r/vitaly-t/connection-string?branch=master)

Takes a URL connection string (with every element being optional): 

```
protocol://user:password@hostname:12345/seg1/seg2?p1=val1&p2=val2
```

and converts it into an object that contains only what's specified:

```js
{
    protocol: 'protocol',
    user: 'user',
    password: 'password',
    host: 'hostname:12345',
    hostname: 'hostname',
    port: 12345,
    segments: ['seg1', 'seg2'],
    params: {
        p1: 'val1',
        p2: 'val2'
    }
}
```

**Short-syntax examples:**

* `localhost` => `{host: 'localhost', hostname: 'localhost'}`
* `localhost:12345` => `{host: 'localhost:12345', hostname: 'localhost', port: 12345}`
* `abc:///seg1?p1=val` => `{protocol: 'abc', segments: ['seg1'], params: {p1: 'val'}}`
* `:12345` => `{host: ':12345', port: 12345}`
* `username@` => `{user: 'username'}`
* `:pass123@` => `{password: 'pass123'}`
* `/seg1/seg2` => `{segments: ['seg1', 'seg2']}`
* `?param1=1&param2=2` => `{params: {param1: '1', param2: '2'}}`

For a complete list of short-syntax examples see the [Optional Format].

All browsers and Node.js versions are supported.

## Installing

```
$ npm install connection-string
```

## Usage

* **Node.js**

```js
var parse = require('connection-string');
var obj = parse('my-server:12345');
```

* **Browsers**

```html
<script src="./connection-string/src"></script>

<script>
    var obj = parseConnectionString('my-server:12345');
</script>
```

* **TypeScript**

```ts
import * as parse from 'connection-string'
import {ConnectionOptions} from 'connection-string'

var a: ConnectionOptions = parse('my-server:12345');
```

For details and examples see the [WiKi Pages].

[WiKi Pages]:https://github.com/vitaly-t/connection-string/wiki
[Optional Format]:https://github.com/vitaly-t/connection-string/wiki#optional-format

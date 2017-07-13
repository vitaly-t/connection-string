connection-string
=================

URL Connection String Parser - _for all browsers and Node.js versions._

[![Build Status](https://travis-ci.org/vitaly-t/connection-string.svg?branch=master)](https://travis-ci.org/vitaly-t/connection-string)
[![Coverage Status](https://coveralls.io/repos/vitaly-t/connection-string/badge.svg?branch=master)](https://coveralls.io/r/vitaly-t/connection-string?branch=master)

Takes a URL connection string (with every element being optional): 

```
protocol://user:password@hostname:12345/seg1/seg2?p1=val1&p2=val2
```

and converts it into an object:

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

It only sets properties that are present in the connection string. See the [Optional Format].

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

connection-string
=================

Advanced URL Connection String Parser, with fully optional syntax.

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

## Why use it?

Unlike the standard URL parser, this one supports the following:

* Fully optional syntax for every element in the connection string
* Configuration of defaults for any parameter that's missing
* Friendlier access to the URL's segments and parameters
* TypeScript declarations are deployed with the library
 
**Short-syntax examples:**

* `localhost` => `{host: 'localhost', hostname: 'localhost'}`
* `localhost:12345` => `{host: 'localhost:12345', hostname: 'localhost', port: 12345}`
* `1.2.3.4:123` => `{host: '1.2.3.4:123', hostname: '1.2.3.4', port: 123}`
* `[12ab:34cd]:123` => `{host: '[12ab:34cd]:123', hostname: '12ab:34cd', port: 123}`
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

or as a class:

```js
var ConnectionString = require('connection-string');
var obj = new ConnectionString('my-server:12345');
```

* **Browsers**

```html
<script src="./connection-string/src"></script>

<script>
    var obj = new ConnectionString('my-server:12345');
</script>
```

* **TypeScript**

```ts
import {ConnectionString} from 'connection-string'

var a = new ConnectionString('my-server:12345');
```

For details and examples see the [WiKi Pages].

## API

Both the root function and class `ConnectionString` take a second optional parameter `defaults`.
If it is specified, the parser will call method `setDefaults` automatically (see below). 

The object returned by the parser contains all the properties as specified in the connection string,
plus two methods: `setDefaults` and `build` (see below).

#### Method `setDefaults`

```
setDefaults(defaults) => void
```

The method takes an object with default values and sets those for all the properties that were not
specified within the connection string. 

You can make use of this method either explicitly, after constructing the class, or implicitly, by 
passing `defaults` into the parser/constructor.

Example:
 
```js
var a = new ConnectionString('abc://localhost', {
    // defaults:
    port: 123,
    user: 'guest'
});
// a => {
//   protocol: 'abc',
//   host: 'localhost',
//   hostname: 'localhost',
//   port: 123,
//   user: 'guest'
// }
```

#### Method `build`

```
build() => string
```

Constructs and returns the connection string from all the current properties.

Example:
 
```js
var a = new ConnectionString('abc://localhost');
a.setDefaults({user: 'guest', port: 123});
a.build(); //=> 'abc://guest:@localhost:123'
```

[WiKi Pages]:https://github.com/vitaly-t/connection-string/wiki
[Optional Format]:https://github.com/vitaly-t/connection-string/wiki#optional-format

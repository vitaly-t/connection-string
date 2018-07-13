connection-string
=================

Advanced URL Connection String Parser, with fully optional syntax.

[![Build Status](https://travis-ci.org/vitaly-t/connection-string.svg?branch=master)](https://travis-ci.org/vitaly-t/connection-string)
[![Coverage Status](https://coveralls.io/repos/vitaly-t/connection-string/badge.svg?branch=master)](https://coveralls.io/r/vitaly-t/connection-string?branch=master)

Takes a URL connection string (with every element being optional): 

```
protocol://user:password@hostA:123,hostB:456/seg1/seg2?p1=val1&p2=val2
```

and converts it into an object that contains only what's specified:

```js
{
    protocol: 'protocol',
    user: 'user',
    password: 'password',
    hosts: [{name: 'hostA', port: 123}, {name: 'hostB', port: 456}],
    segments: ['seg1', 'seg2'],
    params: {
        p1: 'val1',
        p2: 'val2'
    }
}
```

## Why use it?

Unlike the standard URL parser, this one supports the following:

* Multiple hosts - for connecting to multiple servers
* Fully optional syntax for every element in the connection string
* Configuration of defaults for any parameter that's missing
* Construction of a connection string from all parameters
* Friendlier access to the URL's segments and parameters
* TypeScript declarations are deployed with the library
 
**Short-syntax examples:**

* `localhost` => `{hosts: [{name: 'localhost'}]`
* `localhost:12345` => `{hosts: [{name: 'localhost', port: 12345}]`
* `1.2.3.4:123` => `{hosts: [name: '1.2.3.4', port: 123}]`
* `[12ab:34cd]:123` => `{hosts: [{name: '12ab:34cd', port: 123}]`
* `abc:///seg1?p1=val` => `{protocol: 'abc', segments: ['seg1'], params: {p1: 'val'}}`
* `:12345` => `{hosts: [{port: 12345}]`
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
const parse = require('connection-string');

const obj1 = parse('my-server:12345');

// with a default:
const obj2 = parse('my-server:12345', {user: 'admin'});
```

or as a class:

```js
const ConnectionString = require('connection-string');

const obj1 = new ConnectionString('my-server:12345');

// with a default:
const obj2 = new ConnectionString('my-server:12345', {user: 'admin'});
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

const a = new ConnectionString('my-server:12345');
```

For details and examples see the [WiKi Pages].

## API

Both the root function and class `ConnectionString` take a second optional parameter `defaults`.
If it is specified, the parser will call method `setDefaults` automatically (see below). 

The object returned by the parser contains all the properties as specified in the connection string,
plus two methods: `setDefaults` and `build` (see below).

#### Method `setDefaults(defaults) => ConnectionString`

The method takes an object with default values, sets those for all the properties that were not
specified within the connection string, and returns the same object (itself). 

You can make use of this method either explicitly, after constructing the class, or implicitly, by 
passing `defaults` into the parser/constructor.

#### Method `build() => string`

Constructs and returns a connection string from all the current properties.

Example:
 
```js
const a = new ConnectionString('abc://localhost');
a.setDefaults({user: 'guest'});
a.build(); //=> 'abc://guest@localhost'
```

For any parameter within `params`, if the value is not a string, it will be converted into a JSON
string first, and then URL-encoded.

[WiKi Pages]:https://github.com/vitaly-t/connection-string/wiki
[Optional Format]:https://github.com/vitaly-t/connection-string/wiki#optional-format

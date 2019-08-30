connection-string
=================

Advanced URL Connection String parser + generator, with fully optional syntax.

Implemented in TypeScript 3.x, with `strict` mode. 

[![Build Status](https://travis-ci.org/vitaly-t/connection-string.svg?branch=master)](https://travis-ci.org/vitaly-t/connection-string)
[![Coverage Status](https://coveralls.io/repos/vitaly-t/connection-string/badge.svg?branch=master)](https://coveralls.io/r/vitaly-t/connection-string?branch=master)

Takes a URL connection string (with every element being optional):

```
protocol://user:password@host1:123,[abcd::]:456/one/two?p1=val1&msg=hello+world!
```

and converts it into an object that contains only what's specified:

```js
{
    protocol: 'protocol',
    user: 'user',
    password: 'password',
    hosts: [
            {name: 'host1', port: 123, type: 'domain'},
            {name: '[abcd::]', port: 456, type: 'IPv6'}
            ],
    path: ['one', 'two'],
    params: {
        p1: 'val1',
        msg: 'hello world!'
    }
}
```

And it can generate a valid Connection String from an object - see [connection-string-demo].

For documentation and examples, check out [WiKi Pages] and [API].

This library implements a superset of [Mongodb Connection String Spec](https://github.com/mongodb/specifications/blob/master/source/connection-string/connection-string-spec.rst),
which served as an inspirational basis, but extended to be more flexible and generic. See also [adaptation examples](https://github.com/vitaly-t/connection-string/wiki/Adapters).

## Rationale

Unlike the default URL parser, this one supports the following:

* Multiple hosts - for connecting to multiple servers
* Fully optional syntax for every element in the connection string
* It unifies Unix sockets support with the URL standard
* Automatic defaults configuration for missing parameters
* Re-construction of a connection string from object
* Friendlier access to all of the URL's details

**Short-syntax examples:**

* `localhost` => `{hosts: [{name: 'localhost', type: 'domain'}]`
* `localhost:12345` => `{hosts: [{name: 'localhost', port: 12345, type: 'domain'}]`
* `[12ab:34cd]:123` => `{hosts: [{name: '[12ab:34cd]', port: 123, type: 'IPv6'}]`
* `abc:///one?p1=val` => `{protocol: 'abc', path: ['one'], params: {p1: 'val'}}`
* `:12345` => `{hosts: [{port: 12345}]`
* `username@` => `{user: 'username'}`
* `:pass123@` => `{password: 'pass123'}`
* `/one/two` => `{path: ['one', 'two']}`
* `?p1=1&p2=a+b` => `{params: {p1: '1', p2: 'a b'}}`

For more short-syntax examples see [Optional Format].

## Installing

```
$ npm install connection-string
```

## Usage

* **TypeScript**

```ts
import {ConnectionString} from 'connection-string';

const a = new ConnectionString('my-server:12345');
//=> {hosts: [{name: 'my-server', port: 12345, type: 'domain'}]}
```

* **Node.js**

```js
const {ConnectionString} = require('connection-string');

const obj = new ConnectionString('my-server:12345');
//=> {hosts: [{name: 'my-server', port: 12345, type: 'domain'}]}
```

See also [WiKi Pages] for more examples and documentation.

* **Browsers**

TypeScript is the recommended way to include this library into a web application. Otherwise,
you will have to [Browserify] distribution file `dist/index.js`, and then include the result.

## API

When parsing a connection string, via the function or class constructor, you can pass in optional object `defaults`,
to automatically call `setDefaults` in the end, to provide defaults for the values that are missing. See the method below.

The object returned by the parser contains only what is present in the connection string, combined with the defaults,
if those were specified, plus methods as documented further.

In addition, the class has [virtual properties](#virtual-properties) `hostname` + `port`, for simpler and safer
access to the first host details, compatible with parsers that do not support multiple hosts.

### `setDefaults(defaults) => ConnectionString`

The method takes an object with default values (unencoded), and safely combines it with what's missing in the current object.

Please note that while missing defaults for `hosts` and `params` are merged with the existing sets, for the `path` they are not,
since their order is often important, so the defaults for `path` are only used when there are no path segments
in the current object, though you can override the path manually, just like everything else in the object.

You can call this method either directly or when parsing/constructing the connection string, as the second parameter.

The method returns itself (the current object).

### `toString(options) => string`

For the root `ConnectionString` object, the method generates a connection string from it.

**Example:**

```js
const a = new ConnectionString('abc://localhost');
a.setDefaults({user: 'guest', password: 'pass123'});
a.toString(); //=> 'abc://guest:pass123@localhost'
```

You can also call `toString()` on both `hosts` property of the object, and individual host objects,
if you want to generate a complete host name from the current properties.

**Example:**

```js
const a = new ConnectionString('abc://my-host:123,[abcd::]:456');
a.hosts.toString(); //=> 'my-host:123,[abcd::]:456'
a.hosts[0].toString(); //=> 'my-host:123'
a.hosts[1].toString(); //=> '[abcd::]:456'
```

The method takes one optional parameter - URL encoding options:

* `encodeDollar` - Boolean (false), indicates whether `$` should be encoded as `%24`. By default, `$` is not URL-encoded,
as it is not used very often, and even when it is used, it is usually either in the password or a parameter name, where encoding
is typically not needed. But if you do need `$` encoded everywhere, pass in `{encodeDollar: true}`.

* `plusForSpace` - Boolean (false) - encodes spaces as `+` instead of `%20`. 

* `passwordHash` - Boolean (false)|String - replaces each password symbol with `#`, to generate a secure connection string.
But when set to a non-empty string, its first symbol is used instead. Symbol `#` will prevent parsing such string again,
on purpose. But if you want it parsed again, use a different symbol, for example - `passwordHash: '*'` 

### `static parseHost(host) => {name, port, type} | null`

When using an external list of default hosts (unencoded), you may need to parse them independently, using this method,
so they can be correctly processed by method `setDefaults`.

```js
const h = ConnectionString.parseHost('[abcd::]:111');
//=> {name: '[abcd::]', port: 111, type: 'IPv6'}

const a = new ConnectionString('test://localhost:222/dbname', {hosts: [h]});
a.toString();
//=> test://localhost:222,[abcd::]:111/dbname
```

* Property `type`, when present, can be any of the following: `domain | socket | IPv4 | IPv6`.
* If no valid host information is found, the method returns `null`.

For a good example, see [connection-string-demo].

### Virtual Properties

Type `ConnectionString` supports non-enumerable read-only properties `hostname` and `port`,
for compatibility with parsers that do not support multiple hosts:

* `hostname = hosts && hosts[0].name`
* `port = hosts && hosts[0].port`

### Extras

For some typical questions, consult the [FAQ Page].  

[API]:#api
[FAQ Page]:https://github.com/vitaly-t/connection-string/wiki/FAQ
[WiKi Pages]:https://github.com/vitaly-t/connection-string/wiki
[Browserify]:https://github.com/browserify/browserify
[Optional Format]:https://github.com/vitaly-t/connection-string/wiki#optional-format
[connection-string-demo]:https://github.com/vitaly-t/connection-string-demo

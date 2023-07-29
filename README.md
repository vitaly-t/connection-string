connection-string
=================

[![Build Status](https://github.com/vitaly-t/connection-string/workflows/ci/badge.svg?branch=master)](https://github.com/vitaly-t/connection-string/actions?query=workflow%3Aci+branch%3Amaster)
[![Node Version](https://img.shields.io/badge/nodejs-14%20--%2018-green.svg?logo=node.js&style=flat)](https://nodejs.org)

Advanced URL Connection String parser + generator, with fully optional syntax.

It takes a URL connection string (with every element being optional):

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
            ], // = undefined when no hosts specified
    path: ['one', 'two'], // = undefined when no path specified
    params: {
        p1: 'val1',
        msg: 'hello world!'
    } // = undefined when no params specified
}
```

Plus it adds some [Virtual Properties], to simplify access to the first host details.

And it can generate a valid connection string from an object (see [connection-string-demo]).

For documentation and examples, see [WiKi Pages] and [API].

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
* `:12345` => `{hosts: [{port: 12345}]}`
* `username@` => `{user: 'username'}`
* `:pass123@` => `{password: 'pass123'}`
* `/one/two` => `{path: ['one', 'two']}`
* `?p1=1&p2=a+b` => `{params: {p1: '1', p2: 'a b'}}`

For more short-syntax examples see [Optional Format].

## Installing

```
$ npm i connection-string
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
For more details, see [Browsers] page.

## API

[ConnectionString] constructor accepts object `defaults`, as optional second parameter, to automatically
call `setDefaults` in the end, to provide defaults for the values that are missing. See the method below.

The object returned by the parser will contain what's present in the connection string, combined with the defaults,
if those were specified, plus methods as documented further.

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

```ts
const a = new ConnectionString('abc://my-host:123,[abcd::]:456');
a.hosts?.toString(); //=> 'my-host:123,[abcd::]:456'
a.hosts?.[0].toString(); //=> 'my-host:123'
a.hosts?.[1].toString(); //=> '[abcd::]:456'
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

Type [ConnectionString] supports non-enumerable read-only properties [host], [hostname], [port] and [type],
for simpler use when you need only the first host details:

* `host = hosts?.[0].toString()`
* `hostname = hosts?.[0].name`
* `port = hosts?.[0].port`
* `type = hosts?.[0].type`

### Extras

For some typical questions, consult the [FAQ Page].  

[API]:#api
[FAQ Page]:https://github.com/vitaly-t/connection-string/wiki/FAQ
[WiKi Pages]:https://github.com/vitaly-t/connection-string/wiki
[Browserify]:https://github.com/browserify/browserify
[Browsers]:https://github.com/vitaly-t/connection-string/wiki/Browsers
[Optional Format]:https://github.com/vitaly-t/connection-string/wiki#optional-format
[Virtual Properties]:#virtual-properties
[connection-string-demo]:https://github.com/vitaly-t/connection-string-demo
[ConnectionString]:https://github.com/vitaly-t/connection-string/blob/master/src/main.ts#L8
[host]:https://github.com/vitaly-t/connection-string/blob/master/src/main.ts#L49
[hostname]:https://github.com/vitaly-t/connection-string/blob/master/src/main.ts#L56
[port]:https://github.com/vitaly-t/connection-string/blob/master/src/main.ts#L63
[type]:https://github.com/vitaly-t/connection-string/blob/master/src/main.ts#L70

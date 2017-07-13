'use strict';

var parse = require('../src');

describe('init', function () {
    it('must throw on a non-string', function () {
        var error = new TypeError('Invalid connection string!');
        expect(function () {
            parse();
        }).toThrow(error);
        expect(function () {
            parse(123);
        }).toThrow(error);
    });
    it('must throw on inner spaces', function () {
        expect(function () {
            parse('a b');
        }).toThrow(new Error('Invalid URL character at position 1'));
        expect(function () {
            parse('ab\tc');
        }).toThrow(new Error('Invalid URL character at position 2'));
    });

    it('must allow an empty string', function () {
        expect(parse('')).toEqual({});
    });
});

describe('protocol', function () {
    it('must recognize standard format', function () {
        expect(parse('abc://')).toEqual({protocol: 'abc'});
    });
    it('must ignore incomplete format', function () {
        expect(parse('abc:/')).toEqual({host: 'abc', hostname: 'abc'});
    });
    it('must throw on invalid format', function () {
        var error = new TypeError('Invalid \'protocol\' specification.');
        expect(function () {
            parse('://');
        }).toThrow(error);
        expect(function () {
            parse('://///');
        }).toThrow(error);
    });
    it('must decode URL-encoded characters', function () {
        expect(parse('a%20b://')).toEqual({protocol: 'a b'});
    });
    it('must support special symbols', function () {
        expect(parse('$-_.+!*\'()://')).toEqual({protocol: '$-_.+!*\'()'});
    });
});

describe('user', function () {
    it('must allow only the user', function () {
        expect(parse('name@')).toEqual({user: 'name'});
    });
    it('must decode URL-encoded characters', function () {
        expect(parse('first%20name@')).toEqual({user: 'first name'});
    });
    it('must support special symbols', function () {
        expect(parse('$-_.+!*\'()@')).toEqual({user: '$-_.+!*\'()'});
    });
});

describe('password', function () {
    it('must allow only the password', function () {
        expect(parse(':pass@')).toEqual({password: 'pass'});
    });
    it('must decode URL-encoded characters', function () {
        expect(parse(':pass%20123@')).toEqual({password: 'pass 123'});
    });
    it('must support special symbols', function () {
        expect(parse(':$-_.+!*\'()@')).toEqual({password: '$-_.+!*\'()'});
    });
});

describe('user+password', function () {
    it('must allow skipping both', function () {
        expect(parse('@')).toEqual({});
        expect(parse(':@')).toEqual({});
    });
});

describe('host', function () {
    it('must allow without port', function () {
        expect(parse('server')).toEqual({
            host: 'server',
            hostname: 'server'
        });
    });
    it('must not allow URL characters', function () {
        expect(parse('server%20')).toEqual({
            host: 'server',
            hostname: 'server'
        });
    });
    it('must allow IPv4 addresses', function () {
        expect(parse('1.2.3.456')).toEqual({
            host: '1.2.3.456',
            hostname: '1.2.3.456'
        });
    });
    it('must recognize IPv6 addresses', function () {
        expect(parse('[2001:0db8:0000:0000:0000:ff00:0042:8329]')).toEqual({
            host: '[2001:0db8:0000:0000:0000:ff00:0042:8329]',
            hostname: '2001:0db8:0000:0000:0000:ff00:0042:8329'
        });
        expect(parse('[2001:0db8]:123')).toEqual({
            host: '[2001:0db8]:123',
            hostname: '2001:0db8',
            port: 123
        });
    });
    it('must not treat IPv6 scopes as special characters', function () {
        expect(parse('[2001:0db8%20]')).toEqual({
            host: '[2001:0db8%20]',
            hostname: '2001:0db8%20'
        });
    });
    it('must skip invalid IPv6 addresses', function () {
        expect(parse('[]')).toEqual({});
        expect(parse('[a]:123')).toEqual({});
        expect(parse('[a-b-c]')).toEqual({});
    });
});

describe('port', function () {
    it('must allow without server', function () {
        expect(parse(':12345')).toEqual({
            host: ':12345',
            port: 12345
        });
    });
});

describe('segments', function () {
    it('must ignore empty segments', function () {
        expect(parse('/')).toEqual({});
        expect(parse('//')).toEqual({});
        expect(parse('///')).toEqual({});
        expect(parse('//')).toEqual({});
    });
    it('must enumerate all segments', function () {
        expect(parse('/one/two')).toEqual({segments: ['one', 'two']});
    });
    it('must recognize after protocol', function () {
        expect(parse('abc:///one')).toEqual({protocol: 'abc', segments: ['one']});
        expect(parse('abc:////one')).toEqual({protocol: 'abc', segments: ['one']});
    });
    it('must decode URL-encoded characters', function () {
        expect(parse('/one%20/%20two')).toEqual({segments: ['one ', ' two']});
    });
    it('must support special symbols', function () {
        expect(parse('/$-_.+!*\'()')).toEqual({segments: ['$-_.+!*\'()']});
    });
});

describe('params', function () {
    it('must support lack of parameters', function () {
        expect(parse('?')).toEqual({});
        expect(parse('/?')).toEqual({});
    });
    it('must support short parameters', function () {
        expect(parse('?a=1&b=2')).toEqual({
            params: {
                a: '1',
                b: '2'
            }
        });
    });
    it('must ignore empty parameters', function () {
        expect(parse('?a=1&b=&c=3')).toEqual({
            params: {
                a: '1',
                c: '3'
            }
        });
    });
    it('must decode URL-encoded characters', function () {
        expect(parse('?a%20b=test')).toEqual({
            params: {
                'a b': 'test'
            }
        });
    });
    it('must support special symbols', function () {
        expect(parse('?$-_.+!*\'()=$-_.+!*\'()')).toEqual({
            params: {
                '$-_.+!*\'()': '$-_.+!*\'()'
            }
        });
    });
});

describe('complex', function () {
    it('protocol + segment', function () {
        expect(parse('a:///seg')).toEqual({
            protocol: 'a',
            segments: ['seg']
        });
        expect(parse('a:////seg')).toEqual({
            protocol: 'a',
            segments: ['seg']
        });
    });
    it('protocol + params', function () {
        expect(parse('a:///?one=1')).toEqual({
            protocol: 'a',
            params: {
                one: '1'
            }
        });
        expect(parse('a:////?one=1')).toEqual({
            protocol: 'a',
            params: {
                one: '1'
            }
        });
    });
});

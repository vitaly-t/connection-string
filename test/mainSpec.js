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
        expect(parse('://')).toEqual({});
    });
    it('must decode URL-encoded characters', function () {
        expect(parse('a%20b://')).toEqual({protocol: 'a b'});
    });
    it('must support special symbols', function () {
        expect(parse('A9z$-_.+!*\'()://')).toEqual({protocol: 'A9z$-_.+!*\'()'});
    });
});

describe('user', function () {
    it('must allow only the user', function () {
        expect(parse('Name@')).toEqual({user: 'Name'});
    });
    it('must allow user name = 0', function () {
        expect(parse('0@')).toEqual({user: '0'});
    });
    it('must decode URL-encoded characters', function () {
        expect(parse('First%20name@')).toEqual({user: 'First name'});
    });
    it('must support special symbols', function () {
        expect(parse('A9z$-_.+!*\'()@')).toEqual({user: 'A9z$-_.+!*\'()'});
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

describe('user + password', function () {
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
    it('must skip port endings', function () {
        expect(parse('local:123/')).toEqual({host: 'local:123', hostname: 'local', port: 123});
        expect(parse('local:123?')).toEqual({host: 'local:123', hostname: 'local', port: 123});
    });
    it('must not allow URL characters', function () {
        expect(parse('server%20')).toEqual({
            host: 'server',
            hostname: 'server'
        });
    });
    it('must allow special characters', function () {
        expect(parse('one-1.TWO-23')).toEqual({
            host: 'one-1.TWO-23',
            hostname: 'one-1.TWO-23'
        });
    });
    it('must recognize IPv6 addresses', function () {
        expect(parse('[2001:0db8:0000:0000:0000:FF00:0042:8329]')).toEqual({
            host: '[2001:0db8:0000:0000:0000:FF00:0042:8329]',
            hostname: '2001:0db8:0000:0000:0000:FF00:0042:8329'
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
    it('must ignore the invalid ports', function () {
        // TODO: consider adding, or not?
        // expect(parse('[::]:1a')).toEqual({host: '[::]', hostname: '::'});
        expect(parse('[::]:abc')).toEqual({host: '[::]', hostname: '::'});
    });
    it('must allow valid ports', function () {
        expect(parse('[::]:1')).toEqual({host: '[::]:1', hostname: '::', port: 1});
        expect(parse('[::]:1/')).toEqual({host: '[::]:1', hostname: '::', port: 1});
        expect(parse('[::]:123?')).toEqual({host: '[::]:123', hostname: '::', port: 123});
    });
});

describe('port', function () {
    it('must allow without server', function () {
        expect(parse(':12345')).toEqual({
            host: ':12345',
            port: 12345
        });
    });
    it('must allow port=0', function () {
        expect(parse(':0')).toEqual({
            host: ':0',
            port: 0
        });
    });
    // TODO: consider adding, or not?
    /*
    it('must not allow invalid terminators', function () {
        expect(parse(':12345a')).toEqual({});
        expect(parse('@:12345a')).toEqual({});
        expect(parse(':abc')).toEqual({});
        expect(parse('@:abc123')).toEqual({});
    });*/
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
    it('must recognize with empty protocol', function () {
        expect(parse(':///one')).toEqual({segments: ['one']});
        expect(parse(':////one')).toEqual({segments: ['one']});
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
        expect(parse('?A9z$-_.+!*\'()=A9z$-_.+!*\'()')).toEqual({
            params: {
                'A9z$-_.+!*\'()': 'A9z$-_.+!*\'()'
            }
        });
    });
    it('must work with protocol only', function () {
        expect(parse('://?par1=123')).toEqual({params: {par1: '123'}});
        expect(parse(':///?par1=123')).toEqual({params: {par1: '123'}});
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
    it('must not lose details after the port', function () {
        expect(parse(':123/one')).toEqual({host: ':123', port: 123, segments: ['one']});
    });
});

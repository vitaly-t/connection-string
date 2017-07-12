'use strict';

var parse = require('../lib');

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
    it('must recognize short format', function () {
        expect(parse('abc:/')).toEqual({protocol: 'abc'});
    });
    it('must recognize redundant format', function () {
        expect(parse('abc:///')).toEqual({protocol: 'abc'});
        expect(parse('abc://///')).toEqual({protocol: 'abc'});
    });
    it('must throw on invalid format', function () {
        var error = new TypeError('Invalid \'protocol\' specification.');
        expect(function () {
            parse('://');
        }).toThrow(error);
        expect(function () {
            parse(':/');
        }).toThrow(error);
        expect(function () {
            parse('://///');
        }).toThrow(error);
    });
    it('must decode special characters', function () {
        expect(parse('a%20b://')).toEqual({protocol: 'a b'});
    });
});

describe('user', function () {
    it('must allow only the user', function () {
        expect(parse('name@')).toEqual({user: 'name'});
    });
    it('must decode special characters', function () {
        expect(parse('first%20name@')).toEqual({user: 'first name'});
    });
});

describe('password', function () {
    it('must allow only the password', function () {
        expect(parse(':pass@')).toEqual({password: 'pass'});
    });
    it('must decode special characters', function () {
        expect(parse(':pass%20123@')).toEqual({password: 'pass 123'});
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
    it('must decode special characters', function () {
        expect(parse('server%20123')).toEqual({
            host: 'server 123',
            hostname: 'server 123'
        });
    });
    it('must allow IPv4 addresses', function () {
        expect(parse('1.2.3.4')).toEqual({
            host: '1.2.3.4',
            hostname: '1.2.3.4'
        });
    });
    // TODO: IPv6 in URL-s are to be inside square brackets
    /*
    it('must allow IPv6 addresses', function () {
        expect(parse('[2001:0db8:0000:0000:0000:ff00:0042:8329]')).toEqual({
            host: '2001:0db8:0000:0000:0000:ff00:0042:8329',
            hostname: '2001:0db8:0000:0000:0000:ff00:0042:8329'
        });
    });*/
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
});

describe('params', function () {

});

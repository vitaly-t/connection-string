'use strict';

var parse = require('../lib');

describe('init', function () {
    it('must throw on a non-string', function () {
        var error = new TypeError('Invalid connection string.');
        expect(function () {
            parse();
        }).toThrow(error);
        expect(function () {
            parse(123);
        }).toThrow(error);
    });
    it('must allow an empty string', function () {
        expect(parse('')).toEqual({
            segments: [],
            params: {}
        });
    });
});

describe('protocol', function () {
    it('must recognize standard format', function () {
        expect(parse('abc://')).toEqual(jasmine.objectContaining({
            protocol: 'abc'
        }));
    });
    it('must recognize short format', function () {
        expect(parse('abc:/')).toEqual(jasmine.objectContaining({
            protocol: 'abc'
        }));
    });
    it('must recognize redundant format', function () {
        expect(parse('abc:///')).toEqual(jasmine.objectContaining({
            protocol: 'abc'
        }));
        expect(parse('abc://///')).toEqual(jasmine.objectContaining({
            protocol: 'abc'
        }));
    });
    it('must ignore invalid protocol format', function () {
        expect('protocol' in parse(': //')).toBe(false);
        expect('protocol' in parse(': / /')).toBe(false);
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
});

describe('host', function () {
    it('must allow without port', function () {
        expect(parse('server')).toEqual({
            host: 'server',
            hostname: 'server',
            segments: [],
            params: {}
        });
    });
});

describe('port', function () {
    it('must allow without server', function () {
        expect(parse(':12345')).toEqual({
            host: ':12345',
            port: 12345,
            segments: [],
            params: {}
        });
    });
});

describe('user', function () {
    it('must allow only the user', function () {
        expect(parse('name@')).toEqual({
            user: 'name',
            segments: [],
            params: {}
        });
    });
});

describe('password', function () {
    it('must allow only the password', function () {
        expect(parse(':pass@')).toEqual({
            password: 'pass',
            segments: [],
            params: {}
        });
    });
});

describe('user+password', function () {
    it('must allow skipping both', function () {
        expect(parse('@')).toEqual({
            segments: [],
            params: {}
        });
        expect(parse(':@')).toEqual({
            segments: [],
            params: {}
        });
    });
});

describe('segments', function () {

});

describe('params', function () {

});

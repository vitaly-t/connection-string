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

describe('user', function () {

});

describe('password', function () {

});

describe('host', function () {

});

describe('port', function () {

});

describe('segments', function () {

});

describe('params', function () {

});

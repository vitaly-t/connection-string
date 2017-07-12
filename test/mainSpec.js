'use strict';

var parse = require('../lib');

describe('main', function () {
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
        // TODO: Needs fixing:
        /*
        expect(parse('')).toEqual({
            segments: [],
            params: {}
        });*/
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

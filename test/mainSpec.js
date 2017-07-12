'use strict';

var parse = require('../lib');

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

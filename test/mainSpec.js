'use strict';

var CS = require('../lib');

describe('Main', function () {
    it('must load', function () {
        expect(typeof CS).toBe('function');
        expect(new CS('test')).toEqual({});
    });
});

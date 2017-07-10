'use strict';

const lib = require('../lib');

describe('Main', function () {
    it('must load', () => {
        expect(typeof lib).toBe('object');
    });
});

'use strict';

var ConnectionString = require('../src');

function parse(cs, defaults) {
    return new ConnectionString(cs, defaults);
}

function create(obj) {
    return (new ConnectionString('', obj)).build();
}

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
    it('must throw on invalid defaults', function () {
        var error = new TypeError('Invalid \'defaults\' parameter!');
        expect(function () {
            parse('', '');
        }).toThrow(error);
        expect(function () {
            parse('', 123);
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
    it('must allow empty defaults', function () {
        expect(parse('', {})).toEqual({});
    });
    it('must support function-style calls', function () {
        // eslint-disable-next-line
        expect(ConnectionString('abc://')).toEqual({protocol: 'abc'});
    });
});

describe('protocol', function () {
    it('must recognize standard format', function () {
        expect(parse('abc://')).toEqual({protocol: 'abc'});
    });
    it('must ignore incomplete format', function () {
        expect(parse('abc:/')).toEqual({hosts: [{name: 'abc'}]});
        expect(parse('://')).toEqual({});
    });
    it('must decode URL-encoded characters', function () {
        expect(parse('a%20b%3F://')).toEqual({protocol: 'a b?'});
    });
    it('must support special symbols', function () {
        expect(parse('A9z$-_.+!*\'()://')).toEqual({protocol: 'A9z$-_.+!*\'()'});
    });
});

describe('hosts', function () {
    it('must allow without port', function () {
        expect(parse('server')).toEqual({
            hosts: [{
                name: 'server'
            }]
        });
    });
    it('must ignore port endings', function () {
        expect(parse('local:123/')).toEqual({hosts: [{name: 'local', port: 123}]});
        expect(parse('local:123?')).toEqual({hosts: [{name: 'local', port: 123}]});
    });
    it('must allow URL characters', function () {
        expect(parse('server%201,server%3F2')).toEqual({
            hosts: [{
                name: 'server 1'
            }, {
                name: 'server?2'
            }]
        });
    });
    it('must allow special symbols', function () {
        expect(parse('one-1.TWO-23,three-%3F.sock')).toEqual({
            hosts: [{
                name: 'one-1.TWO-23'
            }, {
                name: 'three-?.sock'
            }]
        });
    });
    it('must recognize IPv6 addresses', function () {
        expect(parse('[2001:0db8:0000:0000:0000:FF00:0042:8329]')).toEqual({
            hosts: [{
                name: '2001:0db8:0000:0000:0000:FF00:0042:8329'
            }]
        });
        expect(parse('[2001:0db8]:123')).toEqual({
            hosts: [{
                name: '2001:0db8',
                port: 123
            }]
        });
    });
    it('must not treat IPv6 scopes as special characters', function () {
        expect(parse('[2001:0db8%20]')).toEqual({
            hosts: [{
                name: '2001:0db8%20'
            }]
        });
    });
    it('must skip invalid IPv6 addresses', function () {
        expect(parse('[]')).toEqual({});
        expect(parse('[a]:123')).toEqual({});
        expect(parse('[a-b-c]')).toEqual({});
    });
    it('must throw on invalid ports', function () {
        expect(function () {
            parse('[::]:1a');
        }).toThrow('Invalid port: 1a');
        expect(parse('[::]:abc')).toEqual({hosts: [{name: '::'}]});
    });
    it('must allow valid ports', function () {
        expect(parse('[::]:1')).toEqual({hosts: [{name: '::', port: 1}]});
        expect(parse('[::]:1/')).toEqual({hosts: [{name: '::', port: 1}]});
        expect(parse('[::]:123?')).toEqual({hosts: [{name: '::', port: 123}]});
    });
});

describe('port', function () {
    it('must allow without server', function () {
        expect(parse(':12345')).toEqual({
            hosts: [
                {port: 12345}]
        });
    });
    it('must not allow port=0', function () {
        expect(function () {
            parse(':0');
        }).toThrow('Invalid port: 0');
    });
    it('must not allow invalid terminators', function () {
        //expect(parse(':12345a')).toEqual({});
        //expect(parse('@:12345a')).toEqual({});
        expect(parse(':abc')).toEqual({});
        expect(parse('@:abc123')).toEqual({});
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
        expect(parse('First%20name%3F@')).toEqual({user: 'First name?'});
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
        expect(parse(':pass%20123%3F@')).toEqual({password: 'pass 123?'});
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
        expect(parse('/one%20/%3Ftwo')).toEqual({segments: ['one ', '?two']});
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
        expect(parse('?a%20b=test%3Fhere')).toEqual({
            params: {
                'a b': 'test?here'
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
    it('it must worl with the user only', function () {
        expect(parse('user@?p1=123')).toEqual({user: 'user', params: {p1: '123'}});
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
        expect(parse('a:///?one=1%3F2')).toEqual({
            protocol: 'a',
            params: {
                one: '1?2'
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
        expect(parse(':123/one')).toEqual({hosts: [{port: 123}], segments: ['one']});
    });
});

describe('build', function () {
    it('must encode protocol', function () {
        expect(create({protocol: 'abc 123?456'})).toBe('abc%20123%3F456://');
    });
    it('must encode user', function () {
        expect(create({user: 'user 1?2'})).toBe('user%201%3F2@');
    });
    it('must encode password', function () {
        expect(create({password: 'pass 1?2'})).toBe(':pass%201%3F2@');
    });
    it('must support user + password', function () {
        expect(parse('user:pass@').build()).toBe('user:pass@');
    });
    it('must support solo hostname', function () {
        expect(parse('server').build()).toBe('server');
    });
    it('must support hostname + port', function () {
        expect(parse('server:123').build()).toBe('server:123');
    });
    it('must encode segments', function () {
        expect(parse('/a%20b').build()).toBe('/a%20b');
        expect(parse('/a/b%20/c').build()).toBe('/a/b%20/c');
    });
    it('must ignore empty segment list', function () {
        var a = parse('');
        a.segments = [];
        expect(a.build()).toBe('');
    });
    it('must encode params', function () {
        var obj = {
            text: 1,
            values: ['one', true]
        };
        var a = parse('', {params: {value1: obj, value2: 'text'}});
        var b = parse(a.build());
        expect(JSON.parse(b.params.value1)).toEqual(obj);
    });
    it('must ignore empty parameter list', function () {
        var a = parse('');
        a.params = {};
        expect(a.build()).toBe('');
    });
});

describe('setDefaults', function () {
    it('must throw on invalid defaults', function () {
        var error = new TypeError('Invalid \'defaults\' parameter!');
        expect(function () {
            parse('').setDefaults();
        }).toThrow(error);
        expect(function () {
            parse('').setDefaults(123);
        }).toThrow(error);
    });
    it('must set the default protocol', function () {
        expect(parse('').setDefaults({protocol: 'abc'})).toEqual({protocol: 'abc'});
    });
    it('must set the default hostname and port', function () {
        expect(parse('').setDefaults({host: 'abc'})).toEqual({}); // cannot set the host directly
        expect(parse('').setDefaults({hosts: [{name: 'abc'}]})).toEqual({hosts: [{name: 'abc'}]});
        expect(parse('').setDefaults({hosts: [{port: 123}]})).toEqual({hosts: [{port: 123}]});
    });
    it('must ignore invalid ports', function () {
        expect(parse('').setDefaults({port: '123'})).toEqual({});
        expect(parse('').setDefaults({port: 'a'})).toEqual({});
        expect(parse('').setDefaults({port: -1})).toEqual({});
        expect(parse('').setDefaults({port: '0'})).toEqual({});
    });
    it('must set the default user', function () {
        expect(parse('').setDefaults({user: 'abc'})).toEqual({user: 'abc'});
    });
    it('must set the default password', function () {
        expect(parse('').setDefaults({password: 'abc'})).toEqual({password: 'abc'});
    });
    it('must set the default segments', function () {
        expect(parse('').setDefaults({segments: ['abc']})).toEqual({segments: ['abc']});
    });
    it('must set the default params', function () {
        expect(parse('').setDefaults({params: {p1: 'abc'}})).toEqual({params: {p1: 'abc'}});
    });
    it('must skip empty params', function () {
        expect(parse('').setDefaults({params: {}})).toEqual({});
    });
    it('must merge params', function () {
        expect(parse('?value1=1').setDefaults({params: {value1: 0, value2: 2}})).toEqual({
            params: {
                value1: '1',
                value2: 2
            }
        });
    });
    it('must ignore empty segments', function () {
        expect(parse('').setDefaults({segments: ['', 123, true, '  ']})).toEqual({});
        expect(parse('').setDefaults({segments: 123})).toEqual({});
    });

});
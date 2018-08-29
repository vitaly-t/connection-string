'use strict';

const ConnectionString = require('../src');

function parse(cs, defaults) {
    return new ConnectionString(cs, defaults);
}

function create(obj) {
    return (new ConnectionString('', obj)).toString();
}

describe('init', () => {
    it('must throw on a non-string', () => {
        const error = 'Invalid connection string!';
        expect(() => {
            parse();
        }).toThrow(error);
        expect(() => {
            parse(123);
        }).toThrow(error);
    });
    it('must throw on invalid symbols', () => {
        const invalidSymbols = '`"#^<>{}\\|\r\n\t';
        invalidSymbols.split('').forEach(s => {
            const a = JSON.stringify(s).replace(/^"|"$/g, '\'');
            expect(() => {
                parse('a' + s + 'b');
            }).toThrow('Invalid URL character ' + a + ' at position 1');
        });
    });
    it('must throw on invalid defaults', () => {
        const error = 'Invalid \'defaults\' parameter!';
        expect(() => {
            parse('', '');
        }).toThrow(error);
        expect(() => {
            parse('', 123);
        }).toThrow(error);
    });
    it('must throw on inner tabs', () => {
        expect(() => {
            parse('ab\tc');
        }).toThrow('Invalid URL character \'\\t\' at position 2');
    });
    it('must allow an empty string', () => {
        expect(parse('')).toEqual({});
    });
    it('must allow empty defaults', () => {
        expect(parse('', {})).toEqual({});
    });
    it('must support function-style calls', () => {
        const cn = ConnectionString;
        expect(cn('abc://')).toEqual({protocol: 'abc'});
    });
});

describe('protocol', () => {
    it('must recognize standard format', () => {
        expect(parse('abc://')).toEqual({protocol: 'abc'});
    });
    it('must ignore incomplete format', () => {
        expect(parse('abc:/')).toEqual({hosts: [{name: 'abc', isIPv6: false}]});
        expect(parse('://')).toEqual({});
    });
    it('must decode URL-encoded characters', () => {
        expect(parse('a%20b%3F://')).toEqual({protocol: 'a b?'});
    });
    it('must support special symbols', () => {
        expect(parse('A9z$-_.+!*\'()://')).toEqual({protocol: 'A9z$-_.+!*\'()'});
    });
});

describe('hosts', () => {
    it('must allow without port', () => {
        expect(parse('server')).toEqual({
            hosts: [{
                name: 'server',
                isIPv6: false
            }]
        });
    });
    it('must ignore port endings', () => {
        expect(parse('local:123/')).toEqual({hosts: [{name: 'local', port: 123, isIPv6: false}]});
        expect(parse('local:123?')).toEqual({hosts: [{name: 'local', port: 123, isIPv6: false}]});
    });
    it('must allow URL characters', () => {
        expect(parse('server%201,server%3F2')).toEqual({
            hosts: [{
                name: 'server 1',
                isIPv6: false
            }, {
                name: 'server?2',
                isIPv6: false
            }]
        });
    });
    it('must allow special symbols', () => {
        expect(parse('one-1.TWO-23,three-%3F.sock')).toEqual({
            hosts: [{
                name: 'one-1.TWO-23',
                isIPv6: false
            }, {
                name: 'three-?.sock',
                isIPv6: false
            }]
        });
    });
    it('must recognize IPv6 addresses', () => {
        expect(parse('[2001:0db8:0000:0000:0000:FF00:0042:8329]')).toEqual({
            hosts: [{
                name: '2001:0db8:0000:0000:0000:FF00:0042:8329',
                isIPv6: true
            }]
        });
        expect(parse('[2001:0db8]:123')).toEqual({
            hosts: [{
                name: '2001:0db8',
                port: 123,
                isIPv6: true
            }]
        });
    });
    it('must not treat IPv6 scopes as special characters', () => {
        expect(parse('[2001:0db8%20]')).toEqual({
            hosts: [{
                name: '2001:0db8%20',
                isIPv6: true
            }]
        });
    });
    it('must skip invalid IPv6 addresses', () => {
        expect(parse('[]')).toEqual({});
        expect(parse('[a]:123')).toEqual({});
        expect(parse('[a-b-c]')).toEqual({});
    });
    it('must throw on invalid ports', () => {
        expect(() => {
            parse('[::]:1a');
        }).toThrow('Invalid port: 1a');
        expect(parse('[::]:abc')).toEqual({hosts: [{name: '::', isIPv6: true}]});
    });
    it('must allow valid ports', () => {
        expect(parse('[::]:1')).toEqual({hosts: [{name: '::', port: 1, isIPv6: true}]});
        expect(parse('[::]:1/')).toEqual({hosts: [{name: '::', port: 1, isIPv6: true}]});
        expect(parse('[::]:123?')).toEqual({hosts: [{name: '::', port: 123, isIPv6: true}]});
    });
});

describe('port', () => {
    it('must allow without server', () => {
        expect(parse(':12345')).toEqual({
            hosts: [
                {port: 12345}]
        });
    });
    it('must not allow 0 or negative ports', () => {
        expect(() => {
            parse(':0');
        }).toThrow('Invalid port: 0');
        expect(() => {
            parse(':-1');
        }).toThrow('Invalid port: -1');
    });
    it('must not allow invalid terminators', () => {
        expect(() => {
            parse(':12345a');
        }).toThrow('Invalid port: 12345a');
        expect(parse(':abc')).toEqual({});
        expect(parse('@:abc123')).toEqual({});
    });
});

describe('user', () => {
    it('must allow only the user', () => {
        expect(parse('Name@')).toEqual({user: 'Name'});
    });
    it('must allow user name = 0', () => {
        expect(parse('0@')).toEqual({user: '0'});
    });
    it('must decode URL-encoded characters', () => {
        expect(parse('First%20name%3F@')).toEqual({user: 'First name?'});
    });
    it('must support special symbols', () => {
        expect(parse('A9z$-_.+!*\'()@')).toEqual({user: 'A9z$-_.+!*\'()'});
    });
});

describe('password', () => {
    it('must allow only the password', () => {
        expect(parse(':pass@')).toEqual({password: 'pass'});
    });
    it('must decode URL-encoded characters', () => {
        expect(parse(':pass%20123%3F@')).toEqual({password: 'pass 123?'});
    });
    it('must support special symbols', () => {
        expect(parse(':$-_.+!*\'()@')).toEqual({password: '$-_.+!*\'()'});
    });
});

describe('user + password', () => {
    it('must allow skipping both', () => {
        expect(parse('@')).toEqual({});
        expect(parse(':@')).toEqual({});
    });
});

describe('path', () => {
    it('must ignore empty path', () => {
        expect(parse('/')).toEqual({});
        expect(parse('//')).toEqual({});
        expect(parse('///')).toEqual({});
        expect(parse('//')).toEqual({});
    });
    it('must enumerate all path segments', () => {
        expect(parse('/one/two')).toEqual({path: ['one', 'two']});
    });
    it('must recognize after protocol', () => {
        expect(parse('abc:///one')).toEqual({protocol: 'abc', path: ['one']});
        expect(parse('abc:////one')).toEqual({protocol: 'abc', path: ['one']});
    });
    it('must recognize with empty protocol', () => {
        expect(parse(':///one')).toEqual({path: ['one']});
        expect(parse(':////one')).toEqual({path: ['one']});
    });
    it('must decode URL-encoded characters', () => {
        expect(parse('/one%20/%3Ftwo')).toEqual({path: ['one ', '?two']});
    });
    it('must support special symbols', () => {
        expect(parse('/$-_.+!*\'()')).toEqual({path: ['$-_.+!*\'()']});
    });
});

describe('params', () => {
    it('must support lack of parameters', () => {
        expect(parse('?')).toEqual({});
        expect(parse('/?')).toEqual({});
    });
    it('must support short parameters', () => {
        expect(parse('?a=1&b=2')).toEqual({
            params: {
                a: '1',
                b: '2'
            }
        });
    });
    it('must ignore empty parameters', () => {
        expect(parse('?a=1&b=&c=3')).toEqual({
            params: {
                a: '1',
                c: '3'
            }
        });
    });
    it('must decode URL-encoded characters', () => {
        expect(parse('?a%20b=test%3Fhere')).toEqual({
            params: {
                'a b': 'test?here'
            }
        });
    });
    it('must support special symbols', () => {
        expect(parse('?A9z$-_.+!*\'()=A9z$-_.+!*\'()')).toEqual({
            params: {
                'A9z$-_.+!*\'()': 'A9z$-_. !*\'()'
            }
        });
    });
    it('must work with protocol only', () => {
        expect(parse('://?par1=123')).toEqual({params: {par1: '123'}});
        expect(parse(':///?par1=123')).toEqual({params: {par1: '123'}});
    });
    it('it must work with the user only', () => {
        expect(parse('user@?p1=123')).toEqual({user: 'user', params: {p1: '123'}});
    });
    it('must convert each plus to a space', () => {
        expect(parse('?p1=1+2+3')).toEqual({params: {p1: '1 2 3'}});
    });
});

describe('complex', () => {
    it('protocol + path', () => {
        expect(parse('a:///path')).toEqual({
            protocol: 'a',
            path: ['path']
        });
        expect(parse('a:////path')).toEqual({
            protocol: 'a',
            path: ['path']
        });
    });
    it('protocol + params', () => {
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
    it('must not lose details after the port', () => {
        expect(parse(':123/one')).toEqual({hosts: [{port: 123}], path: ['one']});
    });
});

describe('toString', () => {
    it('must encode protocol', () => {
        expect(create({protocol: 'abc 123?456'})).toBe('abc%20123%3F456://');
    });
    it('must encode user', () => {
        expect(create({user: 'user 1?2'})).toBe('user%201%3F2@');
    });
    it('must encode password', () => {
        expect(create({password: 'pass 1?2'})).toBe(':pass%201%3F2@');
    });
    it('must support user + password', () => {
        expect(parse('user:pass@').toString()).toBe('user:pass@');
    });
    it('must encode non-IPv6 host name', () => {
        expect(parse('one%20two%20three!').toString()).toBe('one%20two%20three');
    });
    it('must not encode IPv6 host name', () => {
        expect(parse('[123::%20:%20:456]').toString()).toBe('[123::%20:%20:456]');
    });
    it('must support solo hostname', () => {
        expect(parse('server').toString()).toBe('server');
        expect(parse('[123::]').toString()).toBe('[123::]');
    });
    it('must support solo port', () => {
        expect(parse(':123').toString()).toBe(':123');
    });
    it('must support hostname + port', () => {
        expect(parse('server:123').toString()).toBe('server:123');
        expect(parse('[::]:123').toString()).toBe('[::]:123');
    });
    it('must encode path segments', () => {
        expect(parse('/a%20b').toString()).toBe('/a%20b');
        expect(parse('/a/b%20/c').toString()).toBe('/a/b%20/c');
    });
    it('must ignore empty path', () => {
        const a = parse('');
        a.path = [];
        expect(a.toString()).toBe('');
    });
    it('must encode params', () => {
        const obj = {
            text: 1,
            values: ['one', true]
        };
        const a = parse('', {params: {value1: obj, value2: 'text'}});
        const b = parse(a.toString());
        expect(JSON.parse(b.params.value1)).toEqual(obj);
    });
    it('must ignore empty parameter list', () => {
        const a = parse('');
        a.params = {};
        expect(a.toString()).toBe('');
    });
    it('must encode dollar symbol when required', () => {
        expect(parse('abc%20$://user$:pa$$@host$name.com/seg$?par$=1$2').toString()).toBe('abc%20$://user$:pa$$@host$name.com/seg$?par$=1$2');
        expect(parse('abc%20$://user$:pa$$@host$name.com/seg$?par$=1$2').toString({encodeDollar: true})).toBe('abc%20%24://user%24:pa%24%24@host%24name.com/seg%24?par%24=1%242');
    });
});

describe('host.toString()', () => {
    it('must generate full host name', () => {
        expect(ConnectionString.parseHost('localhost:123').toString()).toBe('localhost:123');
        expect(ConnectionString.parseHost('[::]:123').toString()).toBe('[::]:123');

        expect(parse('').setDefaults({
            hosts: [{
                name: 'localhost',
                port: 123
            }]
        }).hosts[0].toString()).toBe('localhost:123');
    });
    it('must encode dollar symbol only when required', () => {
        expect(ConnectionString.parseHost('my$server:123').toString()).toBe('my$server:123');
        expect(ConnectionString.parseHost('my$server:123').toString({encodeDollar: true})).toBe('my%24server:123');

        expect(parse('').setDefaults({
            hosts: [{
                name: 'my$server',
                port: 123
            }]
        }).hosts[0].toString()).toBe('my$server:123');

        expect(parse('').setDefaults({
            hosts: [{
                name: 'my$server',
                port: 123
            }]
        }).hosts[0].toString({encodeDollar: true})).toBe('my%24server:123');

    });
});

describe('setDefaults', () => {
    it('must throw on invalid defaults', () => {
        const error = 'Invalid \'defaults\' parameter!';
        expect(() => {
            parse('').setDefaults();
        }).toThrow(error);
        expect(() => {
            parse('').setDefaults(123);
        }).toThrow(error);
    });
    it('must set the default protocol', () => {
        expect(parse('').setDefaults({protocol: 'abc'})).toEqual({protocol: 'abc'});
    });
    it('must set the default hostname and port', () => {
        expect(parse('my-host').setDefaults({hosts: [{name: '::', isIPv6: true}]})).toEqual({
            hosts: [{
                name: 'my-host',
                isIPv6: false
            }, {name: '::', isIPv6: true}]
        });
        expect(parse('my-host').setDefaults({hosts: [{name: 'my-host'}]})).toEqual({
            hosts: [{
                name: 'my-host',
                isIPv6: false
            }]
        });
        expect(parse('my-host').setDefaults({hosts: [{name: 'my-host', port: 222}]})).toEqual({
            hosts: [
                {
                    name: 'my-host', isIPv6: false
                },
                {
                    name: 'my-host',
                    port: 222,
                    isIPv6: false
                }
            ]
        });
        expect(parse(':111').setDefaults({hosts: [{port: 123}]})).toEqual({
            hosts: [{
                port: 111
            }, {port: 123}]
        });
        expect(parse('').setDefaults({hosts: [{name: 'abc'}]})).toEqual({hosts: [{name: 'abc', isIPv6: false}]});
        expect(parse('').setDefaults({hosts: [{port: 123}]})).toEqual({hosts: [{port: 123}]});
    });
    it('must ignore invalid ports', () => {
        expect(parse('').setDefaults({port: '123'})).toEqual({});
        expect(parse('').setDefaults({port: 'a'})).toEqual({});
        expect(parse('').setDefaults({port: -1})).toEqual({});
        expect(parse('').setDefaults({port: '0'})).toEqual({});
    });
    it('must set the default user', () => {
        expect(parse('').setDefaults({user: 'abc'})).toEqual({user: 'abc'});
    });
    it('must set the default password', () => {
        expect(parse('').setDefaults({password: 'abc'})).toEqual({password: 'abc'});
    });
    it('must set the default path', () => {
        expect(parse('').setDefaults({path: ['abc']})).toEqual({path: ['abc']});
    });
    it('must set the default params', () => {
        expect(parse('').setDefaults({params: {p1: 'abc'}})).toEqual({params: {p1: 'abc'}});
    });
    it('must skip empty params', () => {
        expect(parse('').setDefaults({params: {}})).toEqual({});
    });
    it('must merge params', () => {
        expect(parse('?value1=1').setDefaults({params: {value1: 0, value2: 2}})).toEqual({
            params: {
                value1: '1',
                value2: 2
            }
        });
    });
    it('must ignore empty path segments', () => {
        expect(parse('').setDefaults({path: ['', 123, true, '  ']})).toEqual({});
        expect(parse('').setDefaults({path: 123})).toEqual({});
    });
    it('must ignore invalid and empty hosts', () => {
        expect(parse('').setDefaults({hosts: 1})).toEqual({});
        expect(parse('').setDefaults({hosts: []})).toEqual({});
        expect(parse('').setDefaults({hosts: [1, 2, 3]})).toEqual({});
        expect(parse('').setDefaults({hosts: [{}, {}, {}]})).toEqual({});
    });

});

describe('parseHost', () => {
    const parseHost = ConnectionString.parseHost;
    it('must throw on invalid host', () => {
        const error = 'Invalid \'host\' parameter!';
        expect(() => {
            parseHost();
        }).toThrow(error);
        expect(() => {
            parseHost(123);
        }).toThrow(error);
    });
    it('must allow empty hosts', () => {
        expect(parseHost('')).toBeNull();
        expect(parseHost(':')).toBeNull();
    });
    it('must trim hosts', () => {
        expect(parseHost('      ')).toBeNull();
        expect(parseHost('   :   ')).toBeNull();
        expect(parseHost('\r\n \t  abc\r\n')).toEqual({name: 'abc', isIPv6: false});
    });
    it('must parse valid hosts', () => {
        expect(parseHost('a')).toEqual({name: 'a', isIPv6: false});
        expect(parseHost('a:123')).toEqual({name: 'a', port: 123, isIPv6: false});
        expect(parseHost('[::]:123')).toEqual({name: '::', port: 123, isIPv6: true});
    });
});

import {inspect} from 'util';
import {EOL} from 'os';

import {ConnectionString, IConnectionDefaults, HostType, IHost, IParsedHost} from '../src';

function parse(cs?: string | null, defaults?: IConnectionDefaults): ConnectionString {
    return new ConnectionString(cs, defaults);
}

function invalidParse(cs?: any, defaults?: any) {
    return new ConnectionString(cs, defaults);
}

function parseHost(host: string): IParsedHost | null {
    return ConnectionString.parseHost(host);
}

function parseInvalidHost(host?: any) {
    return ConnectionString.parseHost(<string>host);
}

function create(defaults: IConnectionDefaults): string {
    return (new ConnectionString('', defaults)).toString();
}

function removeColors(text: string) {
    /*eslint no-control-regex: 0*/
    return text.replace(/\x1B\[([0-9]{1,2}(;[0-9]{1,2})?)?[m|K]/g, '');
}

const portErrMsg = (txt: string) => 'Invalid port: "' + txt + '". Valid port range is: [1...65535]';

describe('constructor', () => {
    it('must allow undefined', () => {
        const cs = new ConnectionString();
        expect(cs).toEqual({});
    });
    it('must allow null', () => {
        const cs = new ConnectionString(null);
        expect(cs).toEqual({});
    });
    it('must throw when used as a function', () => {
        expect(() => {
            (ConnectionString as any)();
        }).toThrow('Class constructor ConnectionString cannot be invoked without \'new\'');
    });
    it('must throw on invalid connection string', () => {
        const error = 'Invalid connection string: ';
        expect(() => {
            invalidParse(true);
        }).toThrow(error + true);
        expect(() => {
            invalidParse(123);
        }).toThrow(error + 123);
    });
    it('must throw on invalid symbols', () => {
        const invalidSymbols = '`"#^<>{}\\| \r\n\t';
        invalidSymbols.split('').forEach(s => {
            const a = JSON.stringify(s).replace(/^"|"$/g, '\'');
            expect(() => {
                parse('a' + s + 'b');
            }).toThrow('Invalid URL character ' + a + ' at position 1');
        });
    });
    it('must throw on invalid defaults', () => {
        const error = 'Invalid "defaults" parameter: ';
        expect(() => {
            invalidParse(null, '');
        }).toThrow(error + '""');
        expect(() => {
            invalidParse(null, 123);
        }).toThrow(error + 123);
    });
    it('must throw on inner spaces', () => {
        expect(() => {
            parse('a b');
        }).toThrow('Invalid URL character \' \' at position 1');
        expect(() => {
            parse('ab\tc');
        }).toThrow('Invalid URL character \'\\t\' at position 2');
    });
    it('must allow an empty string', () => {
        expect(parse()).toEqual({});
    });
    it('must allow empty defaults', () => {
        expect(parse('', {})).toEqual({});
    });
});

describe('protocol', () => {
    it('must recognize standard format', () => {
        expect(parse('abc123://')).toEqual({protocol: 'abc123'});
    });
    it('must allow special symbols', () => {
        expect(parse('one+two-three.four:five://')).toEqual({protocol: 'one+two-three.four:five'});
    });
    it('must ignore incomplete format', () => {
        expect(parse('abc:/')).toEqual({hosts: [{name: 'abc', type: 'domain'}]});
        expect(parse('://')).toEqual({});
    });
    it('must throw on invalid symbols', () => {
        expect(() => {
            parse('a$b://');
        }).toThrow('Invalid protocol name: a$b');
        expect(() => {
            parse('a%://');
        }).toThrow('Invalid protocol name: a%');
    });
    it('must throw on leading digits', () => {
        expect(() => {
            parse('123://');
        }).toThrow('Invalid protocol name: 123');
        expect(() => {
            parse('1a://');
        }).toThrow('Invalid protocol name: 1a');
    });
});

describe('hosts', () => {
    it('must allow without port', () => {
        expect(parse('server')).toEqual({
            hosts: [{
                name: 'server',
                type: 'domain'
            }]
        });
    });
    it('must ignore port endings', () => {
        expect(parse('local:123/')).toEqual({hosts: [{name: 'local', port: 123, type: 'domain'}]});
        expect(parse('local:123?')).toEqual({hosts: [{name: 'local', port: 123, type: 'domain'}]});
    });
    it('must allow URL characters', () => {
        expect(parse('server%201,server%3F2')).toEqual({
            hosts: [{
                name: 'server 1',
                type: 'domain'
            }, {
                name: 'server?2',
                type: 'domain'
            }]
        });
    });
    it('must allow special symbols', () => {
        expect(parse('one-1.TWO+23_,three-%3F.gap+here.sock')).toEqual({
            hosts: [{
                name: 'one-1.TWO 23_',
                type: 'domain'
            }, {
                name: 'three-?.gap here.sock',
                type: 'socket'
            }]
        });
    });
    it('must recognize unix sockets', () => {
        expect(parse('%2Fone')).toEqual({hosts: [{name: '/one', type: 'socket'}]});
        expect(parse('one%2F')).toEqual({hosts: [{name: 'one/', type: 'socket'}]});
        expect(parse('one%2Ftwo')).toEqual({hosts: [{name: 'one/two', type: 'socket'}]});
        expect(parse('one.sock')).toEqual({hosts: [{name: 'one.sock', type: 'socket'}]});
        expect(parse('one%2Ftwo.sock')).toEqual({hosts: [{name: 'one/two.sock', type: 'socket'}]});
        expect(parse('one.sock.two')).toEqual({hosts: [{name: 'one.sock.two', type: 'domain'}]});
    });
    it('must recognize valid IPv4 addresses', () => {
        expect(parse('255.255.255.255')).toEqual({
            hosts: [{
                name: '255.255.255.255',
                type: 'IPv4'
            }]
        });
        expect(parse('255.255.255')).toEqual({
            hosts: [{
                name: '255.255.255',
                type: 'domain'
            }]
        });
        expect(parse('255.255.255.255:123')).toEqual({
            hosts: [{
                name: '255.255.255.255',
                port: 123,
                type: 'IPv4'
            }]
        });
    });
    it('must recognize IPv6 addresses', () => {
        expect(parse('[2001:0db8:0000:0000:0000:FF00:0042:8329]')).toEqual({
            hosts: [{
                name: '[2001:0db8:0000:0000:0000:FF00:0042:8329]',
                type: 'IPv6'
            }]
        });
        expect(parse('[2001:0db8]:123')).toEqual({
            hosts: [{
                name: '[2001:0db8]',
                port: 123,
                type: 'IPv6'
            }]
        });
    });
    it('must not treat IPv6 scopes as special characters', () => {
        expect(parse('[2001:0db8%20]')).toEqual({
            hosts: [{
                name: '[2001:0db8%20]',
                type: 'IPv6'
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
            parse(':bad');
        }).toThrow(portErrMsg('bad'));
        expect(() => {
            parse('[::]:1a');
        }).toThrow(portErrMsg('1a'));
        expect(() => {
            parse('[::]:abc');
        }).toThrow(portErrMsg('abc'));
    });
    it('must allow valid ports', () => {
        expect(parse('[::]:1')).toEqual({hosts: [{name: '[::]', port: 1, type: 'IPv6'}]});
        expect(parse('[::]:1/')).toEqual({hosts: [{name: '[::]', port: 1, type: 'IPv6'}]});
        expect(parse('[::]:123?')).toEqual({hosts: [{name: '[::]', port: 123, type: 'IPv6'}]});
    });
    it('must allow simplified access to the first host name', () => {
        expect(parse().hostname).toBeUndefined;
        expect(parse('localhost').hostname).toEqual('localhost');
    });
    it('must allow simplified access to the first host type', () => {
        expect(parse().type).toBeUndefined;
        expect(parse('localhost').type).toEqual('domain');
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
        }).toThrow(portErrMsg('0'));
        expect(() => {
            parse(':-1');
        }).toThrow(portErrMsg('-1'));
    });
    it('must not allow invalid terminators', () => {
        expect(() => {
            parse(':12345a');
        }).toThrow(portErrMsg('12345a'));
    });
    it('must allow simplified access to the first port number', () => {
        expect(parse().port).toBeUndefined();
        expect(parse('localhost').port).toBeUndefined;
        expect(parse(':123').port).toEqual(123);
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
        expect(parse('A9z$-_.+!*\'()@')).toEqual({user: 'A9z$-_. !*\'()'});
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
        expect(parse(':$-_.+!*\'()~@')).toEqual({password: '$-_. !*\'()~'});
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
        expect(parse('/$-_.+!*\'()')).toEqual({path: ['$-_. !*\'()']});
    });
});

describe('params', () => {
    describe('with repeated names', () => {
        it('must join values into array', () => {
            expect(parse('?one=1&one=2&two=3,4&two=5')).toEqual({
                params: {
                    one: ['1', '2'],
                    two: ['3', '4', '5']
                }
            });
            expect(parse('?one=1&one=hello+here,2')).toEqual({params: {one: ['1', 'hello here', '2']}});
        });
        it('must join csv values into array', () => {
            expect(parse('?one=1&one=2,3')).toEqual({params: {one: ['1', '2', '3']}});
            expect(parse('?one=1&one=2,3&one=4,5')).toEqual({params: {one: ['1', '2', '3', '4', '5']}});
            expect(parse('?one=,&one=2,3&one=4,5')).toEqual({params: {one: ['', '', '2', '3', '4', '5']}});
            expect(parse('?one=,&one=1,2&one=,')).toEqual({params: {one: ['', '', '1', '2', '', '']}});
        });
    });
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
                'A9z$-_. !*\'()': 'A9z$-_. !*\'()'
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
        expect(parse('?p1=+1++2+3')).toEqual({params: {p1: ' 1  2 3'}});
    });
    it('must support comma-separated values', () => {
        expect(parse('?one=1,2,3')).toEqual({params: {one: ['1', '2', '3']}});
        expect(parse('?one=,1')).toEqual({params: {one: ['', '1']}});
        expect(parse('?one=1,')).toEqual({params: {one: ['1', '']}});
    });
    it('must convert arrays of values into csv', () => {
        expect(parse('?one=1,2,3').toString()).toEqual('?one=1,2,3');
        expect(create({params: {one: [1, 2, 3]}})).toEqual('?one=1,2,3');
        expect(create({params: {one: [1, 'hello here']}})).toEqual('?one=1,hello%20here');
        expect(create({params: {one: [1, '']}})).toEqual('?one=1,');
        expect(create({params: {one: ['', 1]}})).toEqual('?one=,1');
    });
    it('must treat encoded comma as text', () => {
        expect(parse('?one=1%2C2%2C3')).toEqual({params: {one: '1,2,3'}});
        expect(parse('?one%2C1=1%2C2,3%2C4')).toEqual({params: {'one,1': ['1,2', '3,4']}});
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
    it('must encode user', () => {
        expect(create({user: 'user 1?2'})).toEqual('user%201%3F2@');
    });
    it('must encode password', () => {
        expect(create({password: 'pass 1?2'})).toEqual(':pass%201%3F2@');
    });
    it('must support user + password', () => {
        expect(parse('user:pass@').toString()).toEqual('user:pass@');
    });
    it('must encode non-IPv6 host name', () => {
        expect(parse('one%20two%20three!').toString()).toEqual('one%20two%20three');
    });
    it('must not encode IPv6 host name', () => {
        expect(parse('[123::%20:%20:456]').toString()).toEqual('[123::%20:%20:456]');
    });
    it('must support solo hostname', () => {
        expect(parse('server').toString()).toEqual('server');
        expect(parse('[123::]').toString()).toEqual('[123::]');
    });
    it('must support solo port', () => {
        expect(parse(':123').toString()).toEqual(':123');
    });
    it('must support hostname + port', () => {
        expect(parse('server:123').toString()).toEqual('server:123');
        expect(parse('[::]:123').toString()).toEqual('[::]:123');
    });
    it('must support multiple hosts', () => {
        expect(parse('server1,server2').toString()).toEqual('server1,server2');
        expect(parse('[123::]:11,next:22,last:33').toString()).toEqual('[123::]:11,next:22,last:33');
    });
    it('must encode path segments', () => {
        expect(parse('/a%20b').toString()).toEqual('/a%20b');
        expect(parse('/a/b%20/c').toString()).toEqual('/a/b%20/c');
    });
    it('must ignore empty path', () => {
        const a = parse();
        a.path = [];
        expect(a.toString()).toEqual('');
    });
    it('must encode params', () => {
        const obj = {
            text: 1,
            values: ['one', true]
        };
        const a = parse(null, {params: {value1: obj, value2: 'text'}});
        const b = parse(a.toString());
        expect(JSON.parse(<string>(b.params && b.params.value1))).toStrictEqual(obj);
    });
    it('must ignore empty parameter list', () => {
        const a = parse();
        a.params = {};
        expect(a.toString()).toEqual('');
    });
    it('must encode dollar symbol when required', () => {
        expect(parse('abc://user$:pa$$@host$name.com/seg$?par$=1$2').toString()).toEqual('abc://user$:pa$$@host$name.com/seg$?par$=1$2');
        expect(parse('abc://user$:pa$$@host$name.com/seg$?par$=1$2').toString({encodeDollar: true})).toEqual('abc://user%24:pa%24%24@host%24name.com/seg%24?par%24=1%242');
    });
    it('must use plus for params when required', () => {
        expect(parse('?a=+1++2').toString()).toEqual('?a=%201%20%202');
        expect(parse('?a=+1++2').toString({plusForSpace: true})).toEqual('?a=+1++2');
    });
    it('must produce an empty string when an empty array is set', () => {
        const a = parse();
        a.hosts = [];
        expect(a.toString()).toEqual('');
    });
    it('must skip empty parameters', () => {
        const a = parse();
        a.params = {};
        expect(a.toString()).toEqual('');
    });
    it('must secure passwords', () => {
        expect(parse('user:abc@').toString({passwordHash: true})).toEqual('user:###@');
        expect(parse(':abc@').toString({passwordHash: true})).toEqual(':###@');
        expect(parse('user:abc@').toString({passwordHash: '123'})).toEqual('user:111@');
        expect(parse(':abc@').toString({passwordHash: '123'})).toEqual(':111@');
    });
});

describe('host.toString()', () => {
    it('must generate full host name', () => {
        const h1 = parseHost('localhost:123');
        const h2 = parseHost('[::]:123');
        expect(h1 && h1.toString()).toEqual('localhost:123');
        expect(h2 && h2.toString()).toEqual('[::]:123');

        const defs = parse().setDefaults({
            hosts: [{
                name: 'localhost',
                port: 123
            }]
        });
        expect(defs.hosts && defs.hosts[0].toString()).toEqual('localhost:123');
    });
    it('must encode dollar symbol only when required', () => {
        const h1 = parseHost('my$server:123');
        const h2 = parseHost('my$server:123');
        expect(h1 && h1.toString()).toEqual('my$server:123');
        expect(h2 && h2.toString({encodeDollar: true})).toEqual('my%24server:123');

        const def1 = parse().setDefaults({
            hosts: [{
                name: 'my$server',
                port: 123
            }]
        });
        expect(def1.hosts && def1.hosts[0].toString()).toEqual('my$server:123');

        const def2 = parse().setDefaults({
            hosts: [{
                name: 'my$server',
                port: 123
            }]
        });
        expect(def2.hosts && def2.hosts[0].toString({encodeDollar: true})).toEqual('my%24server:123');
    });
});

describe('setDefaults', () => {
    it('must throw on invalid defaults', () => {
        const error = 'Invalid "defaults" parameter: ';
        expect(() => {
            parse().setDefaults(<{}><unknown>undefined);
        }).toThrow(error + undefined);
        expect(() => {
            parse().setDefaults(<{}><unknown>123);
        }).toThrow(error + 123);
    });
    it('must set the default protocol', () => {
        expect(parse().setDefaults({protocol: 'abc'})).toEqual({protocol: 'abc'});
        expect(parse().setDefaults({protocol: null as any})).toEqual({});
    });
    it('must set the default hostname and port', () => {
        expect(parse().setDefaults({hosts: [{name: '::', type: HostType.IPv6, port: 1}]})).toEqual({
            hosts: [{
                name: '::',
                type: 'IPv6',
                port: 1
            }]
        });
        expect(parse('my-host').setDefaults({hosts: [{name: 'my-host', port: 0}]})).toEqual({
            hosts: [{
                name: 'my-host',
                type: 'domain'
                // note how the invalid port is simply skipped here
            }]
        });
        expect(parse('my-host').setDefaults({hosts: [{name: 'my-host', port: 222}]})).toEqual({
            hosts: [
                {
                    name: 'my-host', type: 'domain'
                },
                {
                    name: 'my-host',
                    port: 222,
                    type: 'domain'
                }
            ]
        });
        expect(parse(':111').setDefaults({hosts: [{port: 123}]})).toEqual({
            hosts: [{
                port: 111
            }, {port: 123}]
        });
        expect(parse().setDefaults({hosts: [{name: 'abc'}]})).toEqual({hosts: [{name: 'abc', type: 'domain'}]});
        expect(parse().setDefaults({hosts: [{port: 123}]})).toEqual({hosts: [{port: 123}]});
    });
    it('must skip invalid hosts', () => {
        expect(parse('my-host').setDefaults({hosts: [{name: '::'}, null]})).toEqual({
            hosts: [{
                name: 'my-host',
                type: 'domain'
            }]
        });
    });
    it('must ignore trailing spaces for host names', () => {
        expect(parse('one').setDefaults({hosts: [{name: ' one '}]})).toEqual({
            hosts: [{name: 'one', type: 'domain'}]
        });
        expect(parse('one').setDefaults({hosts: [{name: ' \t\ttwo\r\n\t '}]})).toEqual({
            hosts: [{name: 'one', type: 'domain'}, {name: 'two', type: 'domain'}]
        });
    });
    it('must ignore invalid ports', () => {
        expect(parse().setDefaults({hosts: [{port: <number><unknown>'123'}]})).toEqual({});
        expect(parse().setDefaults({hosts: [{port: <number><unknown>'a'}]})).toEqual({});
        expect(parse().setDefaults({hosts: [{port: -1}]})).toEqual({});
        expect(parse().setDefaults({hosts: [{port: <number><unknown>'0'}]})).toEqual({});
        expect(parse().setDefaults({hosts: [{port: 0}]})).toEqual({});
    });
    it('must set the default user', () => {
        expect(parse().setDefaults({user: 'abc'})).toEqual({user: 'abc'});
    });
    it('must set the default password', () => {
        expect(parse().setDefaults({password: 'abc'})).toEqual({password: 'abc'});
    });
    it('must set the default path', () => {
        expect(parse().setDefaults({path: ['abc']})).toEqual({path: ['abc']});
    });
    it('must set the default params', () => {
        expect(parse().setDefaults({params: {p1: 'abc'}})).toEqual({params: {p1: 'abc'}});
    });
    it('must skip empty params', () => {
        expect(parse().setDefaults({params: {}})).toEqual({});
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
        expect(parse().setDefaults({path: <string[]><unknown>['', 123, true, '  ']})).toEqual({});
        expect(parse().setDefaults({path: <string[]><unknown>123})).toEqual({});
    });
    it('must ignore invalid and empty hosts', () => {
        expect(parse().setDefaults({hosts: <IHost[]><unknown>1})).toEqual({});
        expect(parse().setDefaults({hosts: []})).toEqual({});
        expect(parse().setDefaults({hosts: <IHost[]>[1, 2, 3]})).toEqual({});
        expect(parse().setDefaults({hosts: [{}, {}, {}]})).toEqual({});
    });
});

describe('parseHost', () => {
    it('must throw on invalid host', () => {
        const error = 'Invalid "host" parameter: ';
        expect(() => {
            parseInvalidHost();
        }).toThrow(error + undefined);
        expect(() => {
            parseInvalidHost(123);
        }).toThrow(error + 123);
    });
    it('must not decode hosts', () => {
        // TODO: should either skip or throw when the host match is partial?
        // expect(parseHost('a b')).toStrictEqual(null);
    });
    it('must allow empty hosts', () => {
        expect(parseHost('')).toBeNull();
        expect(parseHost(':')).toBeNull();
    });
    it('must trim hosts', () => {
        expect(parseHost('      ')).toBeNull();
        expect(parseHost('   :   ')).toBeNull();
        expect(parseHost('\r\n \t  abc\r\n')).toStrictEqual({name: 'abc', type: 'domain'});
    });
    it('must parse valid hosts', () => {
        expect(parseHost('a')).toStrictEqual({name: 'a', type: 'domain'});
        expect(parseHost('a:123')).toStrictEqual({name: 'a', port: 123, type: 'domain'});
        expect(parseHost('1.2.3.4:123')).toStrictEqual({name: '1.2.3.4', port: 123, type: 'IPv4'});
        expect(parseHost('[::]:123')).toStrictEqual({name: '[::]', port: 123, type: 'IPv6'});
        expect(parseHost('a.sock')).toStrictEqual({name: 'a.sock', type: 'socket'});
        expect(parseHost('/a')).toStrictEqual({name: '/a', type: 'socket'});
        expect(parseHost('a/')).toStrictEqual({name: 'a/', type: 'socket'});

        // TODO: host parsing is a bit buggy, needs overhaul
        //    odd/arguable tests:
        // expect(parseHost('123.0.0.1-hello')).toStrictEqual({name: '123.0.0.1-hello', type: 'IPv4'});
        // expect(parseHost('[::]/here')).toStrictEqual({name: '[::]here', type: 'IPv6'});
    });
    it('must use inside spaces', () => {
        expect(parseHost(' a b ')).toStrictEqual({name: 'a b', type: 'domain'});
        expect(parseHost(' / a b ')).toStrictEqual({name: '/ a b', type: 'socket'});
    });
    it('must ignore gaps', () => {
        expect(parseHost('a\tb')).toStrictEqual({name: 'a', type: 'domain'});
        expect(parseHost('a\r\nb')).toStrictEqual({name: 'a', type: 'domain'});
    });
});

describe('virtual properties', () => {
    it('must provide correct values', () => {
        const cs = parse('local:123');
        /*
        TODO: This needs fixing, for virtual properties
        expect(cs).toEqual({
            host: 'local:123',
            hostname: 'local',
            port: 123,
            type: 'domain'
        });*/
        expect(cs.host).toEqual('local:123');
        expect(cs.hostname).toEqual('local');
        expect(cs.port).toEqual(123);
        expect(cs.type).toEqual('domain');
    });
    it('must handle empty values', () => {
        const cs = parse();
        expect(cs).toEqual({
            host: undefined,
            hostname: undefined,
            port: undefined,
            type: undefined
        });
        expect(cs.host).toBeUndefined();
        expect(cs.hostname).toBeUndefined();
        expect(cs.port).toBeUndefined();
        expect(cs.type).toBeUndefined();
    });
});

describe('inspection', () => {
    const cs = parse('local:123');
    const out1 = inspect(cs);
    const out2 = removeColors(out1);
    it('must include virtual properties', () => {
        expect(out2).toContain(`${EOL}Virtual Properties:`);
        expect(out2).toContain(`host: 'local:123'`);
        expect(out2).toContain(`hostname: 'local'`);
        expect(out2).toContain(`port: 123`);
        expect(out2).toContain(`type: 'domain'`);
    });
    it.skip('must produce color output', () => {
        // TODO: This needs fixing:
        expect(out1).not.toEqual(out2);
    });
});

import {expect} from './header';
import {ConnectionString, IConnectionDefaults, HostType, IHost, IParsedHost} from '../dist';

function parse(cs: string, defaults?: IConnectionDefaults): ConnectionString {
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

describe('init', () => {
    it('must throw when used as a function', () => {
        expect(() => {
            const test: any = ConnectionString;
            test();
        }).to.throw('Class constructor ConnectionString cannot be invoked without \'new\'');
    });
    it('must throw on a non-string', () => {
        const error = 'Invalid connection string: ';
        expect(() => {
            invalidParse();
        }).to.throw(error + undefined);
        expect(() => {
            invalidParse(123);
        }).to.throw(error + 123);
    });
    it('must throw on invalid symbols', () => {
        const invalidSymbols = '`"#^<>{}\\| \r\n\t';
        invalidSymbols.split('').forEach(s => {
            const a = JSON.stringify(s).replace(/^"|"$/g, '\'');
            expect(() => {
                parse('a' + s + 'b');
            }).to.throw('Invalid URL character ' + a + ' at position 1');
        });
    });
    it('must throw on invalid defaults', () => {
        const error = 'Invalid "defaults" parameter: ';
        expect(() => {
            invalidParse('', '');
        }).to.throw(error + '""');
        expect(() => {
            invalidParse('', 123);
        }).to.throw(error + 123);
    });
    it('must throw on inner spaces', () => {
        expect(() => {
            parse('a b');
        }).to.throw('Invalid URL character \' \' at position 1');
        expect(() => {
            parse('ab\tc');
        }).to.throw('Invalid URL character \'\\t\' at position 2');
    });
    it('must allow an empty string', () => {
        expect(parse('')).to.eql({});
    });
    it('must allow empty defaults', () => {
        expect(parse('', {})).to.eql({});
    });
});

describe('protocol', () => {
    it('must recognize standard format', () => {
        expect(parse('abc://')).to.eql({protocol: 'abc'});
    });
    it('must allow sub-protocols', () => {
        expect(parse('one:two:three://')).to.eql({protocol: 'one:two:three'});
    });
    it('must ignore incomplete format', () => {
        expect(parse('abc:/')).to.eql({hosts: [{name: 'abc', type: 'domain'}]});
        expect(parse('://')).to.eql({});
    });
    it('must decode URL-encoded characters', () => {
        expect(parse('a%20b%3F://')).to.eql({protocol: 'a b?'});
    });
    it('must support special symbols', () => {
        expect(parse('A9z$-_.+!*\'()://')).to.eql({protocol: 'A9z$-_. !*\'()'});
    });
});

describe('hosts', () => {
    it('must allow without port', () => {
        expect(parse('server')).to.eql({
            hosts: [{
                name: 'server',
                type: 'domain'
            }]
        });
    });
    it('must ignore port endings', () => {
        expect(parse('local:123/')).to.eql({hosts: [{name: 'local', port: 123, type: 'domain'}]});
        expect(parse('local:123?')).to.eql({hosts: [{name: 'local', port: 123, type: 'domain'}]});
    });
    it('must allow URL characters', () => {
        expect(parse('server%201,server%3F2')).to.eql({
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
        expect(parse('one-1.TWO-23,three-%3F.sock')).to.eql({
            hosts: [{
                name: 'one-1.TWO-23',
                type: 'domain'
            }, {
                name: 'three-?.sock',
                type: 'socket'
            }]
        });
    });
    it('must recognize unix sockets', () => {
        expect(parse('%2Fone')).to.eql({hosts: [{name: '/one', type: 'socket'}]});
        expect(parse('one%2F')).to.eql({hosts: [{name: 'one/', type: 'socket'}]});
        expect(parse('one%2Ftwo')).to.eql({hosts: [{name: 'one/two', type: 'socket'}]});
        expect(parse('one.sock')).to.eql({hosts: [{name: 'one.sock', type: 'socket'}]});
        expect(parse('one%2Ftwo.sock')).to.eql({hosts: [{name: 'one/two.sock', type: 'socket'}]});
        expect(parse('one.sock.two')).to.eql({hosts: [{name: 'one.sock.two', type: 'domain'}]});
    });
    it('must recognize valid IPv4 addresses', () => {
        expect(parse('255.255.255.255')).to.eql({
            hosts: [{
                name: '255.255.255.255',
                type: 'IPv4'
            }]
        });
        expect(parse('255.255.255')).to.eql({
            hosts: [{
                name: '255.255.255',
                type: 'domain'
            }]
        });
        expect(parse('255.255.255.255:123')).to.eql({
            hosts: [{
                name: '255.255.255.255',
                port: 123,
                type: 'IPv4'
            }]
        });
    });
    it('must recognize IPv6 addresses', () => {
        expect(parse('[2001:0db8:0000:0000:0000:FF00:0042:8329]')).to.eql({
            hosts: [{
                name: '[2001:0db8:0000:0000:0000:FF00:0042:8329]',
                type: 'IPv6'
            }]
        });
        expect(parse('[2001:0db8]:123')).to.eql({
            hosts: [{
                name: '[2001:0db8]',
                port: 123,
                type: 'IPv6'
            }]
        });
    });
    it('must not treat IPv6 scopes as special characters', () => {
        expect(parse('[2001:0db8%20]')).to.eql({
            hosts: [{
                name: '[2001:0db8%20]',
                type: 'IPv6'
            }]
        });
    });
    it('must skip invalid IPv6 addresses', () => {
        expect(parse('[]')).to.eql({});
        expect(parse('[a]:123')).to.eql({});
        expect(parse('[a-b-c]')).to.eql({});
    });
    it('must throw on invalid ports', () => {
        expect(() => {
            parse(':bad');
        }).to.throw('Invalid port number: "bad"');
        expect(() => {
            parse('[::]:1a');
        }).to.throw('Invalid port number: "1a"');
        expect(() => {
            parse('[::]:abc');
        }).to.throw('Invalid port number: "abc"');
    });
    it('must allow valid ports', () => {
        expect(parse('[::]:1')).to.eql({hosts: [{name: '[::]', port: 1, type: 'IPv6'}]});
        expect(parse('[::]:1/')).to.eql({hosts: [{name: '[::]', port: 1, type: 'IPv6'}]});
        expect(parse('[::]:123?')).to.eql({hosts: [{name: '[::]', port: 123, type: 'IPv6'}]});
    });
    it('must allow simplified access to the first host name', () => {
        expect(parse('').hostname).to.be.undefined;
        expect(parse('localhost').hostname).to.eq('localhost');
    });
});

describe('port', () => {
    it('must allow without server', () => {
        expect(parse(':12345')).to.eql({
            hosts: [
                {port: 12345}]
        });
    });
    it('must not allow 0 or negative ports', () => {
        expect(() => {
            parse(':0');
        }).to.throw('Invalid port number: "0"');
        expect(() => {
            parse(':-1');
        }).to.throw('Invalid port number: "-1"');
    });
    it('must not allow invalid terminators', () => {
        expect(() => {
            parse(':12345a');
        }).to.throw('Invalid port number: "12345a"');
    });
    it('must allow simplified access to the first port number', () => {
        expect(parse('').port).to.be.undefined;
        expect(parse('localhost').port).to.be.undefined;
        expect(parse(':123').port).to.eq(123);
    });
});

describe('user', () => {
    it('must allow only the user', () => {
        expect(parse('Name@')).to.eql({user: 'Name'});
    });
    it('must allow user name = 0', () => {
        expect(parse('0@')).to.eql({user: '0'});
    });
    it('must decode URL-encoded characters', () => {
        expect(parse('First%20name%3F@')).to.eql({user: 'First name?'});
    });
    it('must support special symbols', () => {
        expect(parse('A9z$-_.+!*\'()@')).to.eql({user: 'A9z$-_. !*\'()'});
    });
});

describe('password', () => {
    it('must allow only the password', () => {
        expect(parse(':pass@')).to.eql({password: 'pass'});
    });
    it('must decode URL-encoded characters', () => {
        expect(parse(':pass%20123%3F@')).to.eql({password: 'pass 123?'});
    });
    it('must support special symbols', () => {
        expect(parse(':$-_.+!*\'()@')).to.eql({password: '$-_. !*\'()'});
    });
});

describe('user + password', () => {
    it('must allow skipping both', () => {
        expect(parse('@')).to.eql({});
        expect(parse(':@')).to.eql({});
    });
});

describe('path', () => {
    it('must ignore empty path', () => {
        expect(parse('/')).to.eql({});
        expect(parse('//')).to.eql({});
        expect(parse('///')).to.eql({});
        expect(parse('//')).to.eql({});
    });
    it('must enumerate all path segments', () => {
        expect(parse('/one/two')).to.eql({path: ['one', 'two']});
    });
    it('must recognize after protocol', () => {
        expect(parse('abc:///one')).to.eql({protocol: 'abc', path: ['one']});
        expect(parse('abc:////one')).to.eql({protocol: 'abc', path: ['one']});
    });
    it('must recognize with empty protocol', () => {
        expect(parse(':///one')).to.eql({path: ['one']});
        expect(parse(':////one')).to.eql({path: ['one']});
    });
    it('must decode URL-encoded characters', () => {
        expect(parse('/one%20/%3Ftwo')).to.eql({path: ['one ', '?two']});
    });
    it('must support special symbols', () => {
        expect(parse('/$-_.+!*\'()')).to.eql({path: ['$-_. !*\'()']});
    });
});

describe('params', () => {
    it('must throw when repeated', () => {
        expect(() => {
            parse('?one=1&one=2');
        }).to.throw('Parameter "one" is repeated.');
    });
    it('must support lack of parameters', () => {
        expect(parse('?')).to.eql({});
        expect(parse('/?')).to.eql({});
    });
    it('must support short parameters', () => {
        expect(parse('?a=1&b=2')).to.eql({
            params: {
                a: '1',
                b: '2'
            }
        });
    });
    it('must ignore empty parameters', () => {
        expect(parse('?a=1&b=&c=3')).to.eql({
            params: {
                a: '1',
                c: '3'
            }
        });
    });
    it('must decode URL-encoded characters', () => {
        expect(parse('?a%20b=test%3Fhere')).to.eql({
            params: {
                'a b': 'test?here'
            }
        });
    });
    it('must support special symbols', () => {
        expect(parse('?A9z$-_.+!*\'()=A9z$-_.+!*\'()')).to.eql({
            params: {
                'A9z$-_. !*\'()': 'A9z$-_. !*\'()'
            }
        });
    });
    it('must work with protocol only', () => {
        expect(parse('://?par1=123')).to.eql({params: {par1: '123'}});
        expect(parse(':///?par1=123')).to.eql({params: {par1: '123'}});
    });
    it('it must work with the user only', () => {
        expect(parse('user@?p1=123')).to.eql({user: 'user', params: {p1: '123'}});
    });
    it('must convert each plus to a space', () => {
        expect(parse('?p1=+1++2+3')).to.eql({params: {p1: ' 1  2 3'}});
    });
});

describe('complex', () => {
    it('protocol + path', () => {
        expect(parse('a:///path')).to.eql({
            protocol: 'a',
            path: ['path']
        });
        expect(parse('a:////path')).to.eql({
            protocol: 'a',
            path: ['path']
        });
    });
    it('protocol + params', () => {
        expect(parse('a:///?one=1%3F2')).to.eql({
            protocol: 'a',
            params: {
                one: '1?2'
            }
        });
        expect(parse('a:////?one=1')).to.eql({
            protocol: 'a',
            params: {
                one: '1'
            }
        });
    });
    it('must not lose details after the port', () => {
        expect(parse(':123/one')).to.eql({hosts: [{port: 123}], path: ['one']});
    });
});

describe('toString', () => {
    it('must encode protocol', () => {
        expect(create({protocol: 'abc 123?456'})).to.eq('abc%20123%3F456://');
        expect(create({protocol: 'one:two:three'})).to.eq('one:two:three://');
    });
    it('must encode user', () => {
        expect(create({user: 'user 1?2'})).to.eq('user%201%3F2@');
    });
    it('must encode password', () => {
        expect(create({password: 'pass 1?2'})).to.eq(':pass%201%3F2@');
    });
    it('must support user + password', () => {
        expect(parse('user:pass@').toString()).to.eq('user:pass@');
    });
    it('must encode non-IPv6 host name', () => {
        expect(parse('one%20two%20three!').toString()).to.eq('one%20two%20three');
    });
    it('must not encode IPv6 host name', () => {
        expect(parse('[123::%20:%20:456]').toString()).to.eq('[123::%20:%20:456]');
    });
    it('must support solo hostname', () => {
        expect(parse('server').toString()).to.eq('server');
        expect(parse('[123::]').toString()).to.eq('[123::]');
    });
    it('must support solo port', () => {
        expect(parse(':123').toString()).to.eq(':123');
    });
    it('must support hostname + port', () => {
        expect(parse('server:123').toString()).to.eq('server:123');
        expect(parse('[::]:123').toString()).to.eq('[::]:123');
    });
    it('must support multiple hosts', () => {
        expect(parse('server1,server2').toString()).to.eq('server1,server2');
        expect(parse('[123::]:11,next:22,last:33').toString()).to.eq('[123::]:11,next:22,last:33');
    });
    it('must encode path segments', () => {
        expect(parse('/a%20b').toString()).to.eq('/a%20b');
        expect(parse('/a/b%20/c').toString()).to.eq('/a/b%20/c');
    });
    it('must ignore empty path', () => {
        const a = parse('');
        a.path = [];
        expect(a.toString()).to.eq('');
    });
    it('must encode params', () => {
        const obj = {
            text: 1,
            values: ['one', true]
        };
        const a = parse('', {params: {value1: obj, value2: 'text'}});
        const b = parse(a.toString());
        expect(JSON.parse(<string>(b.params && b.params.value1))).to.eql(obj);
    });
    it('must ignore empty parameter list', () => {
        const a = parse('');
        a.params = {};
        expect(a.toString()).to.eq('');
    });
    it('must encode dollar symbol when required', () => {
        expect(parse('abc%20$://user$:pa$$@host$name.com/seg$?par$=1$2').toString()).to.eq('abc%20$://user$:pa$$@host$name.com/seg$?par$=1$2');
        expect(parse('abc%20$://user$:pa$$@host$name.com/seg$?par$=1$2').toString({encodeDollar: true})).to.eq('abc%20%24://user%24:pa%24%24@host%24name.com/seg%24?par%24=1%242');
    });
    it('must use plus for params when required', () => {
        expect(parse('?a=+1++2').toString()).to.eq('?a=%201%20%202');
        expect(parse('?a=+1++2').toString({plusForSpace: true})).to.eq('?a=+1++2');
    });
    it('must produce an empty string when an empty array is set', () => {
        const a = parse('');
        a.hosts = [];
        expect(a.toString()).to.eq('');
    });
    it('must skip empty parameters', () => {
        const a = parse('');
        a.params = {};
        expect(a.toString()).to.eq('');
    });
    it('must secure passwords', () => {
        expect(parse('user:abc@').toString({passwordHash: true})).to.eq('user:###@');
        expect(parse(':abc@').toString({passwordHash: true})).to.eq(':###@');
        expect(parse('user:abc@').toString({passwordHash: '123'})).to.eq('user:111@');
        expect(parse(':abc@').toString({passwordHash: '123'})).to.eq(':111@');
    });
});

describe('host.toString()', () => {
    it('must generate full host name', () => {
        const h1 = parseHost('localhost:123');
        const h2 = parseHost('[::]:123');
        expect(h1 && h1.toString()).to.eq('localhost:123');
        expect(h2 && h2.toString()).to.eq('[::]:123');

        const defs = parse('').setDefaults({
            hosts: [{
                name: 'localhost',
                port: 123
            }]
        });
        expect(defs.hosts && defs.hosts[0].toString()).to.eq('localhost:123');
    });
    it('must encode dollar symbol only when required', () => {
        const h1 = parseHost('my$server:123');
        const h2 = parseHost('my$server:123');
        expect(h1 && h1.toString()).to.eq('my$server:123');
        expect(h2 && h2.toString({encodeDollar: true})).to.eq('my%24server:123');

        const def1 = parse('').setDefaults({
            hosts: [{
                name: 'my$server',
                port: 123
            }]
        });
        expect(def1.hosts && def1.hosts[0].toString()).to.eq('my$server:123');

        const def2 = parse('').setDefaults({
            hosts: [{
                name: 'my$server',
                port: 123
            }]
        });
        expect(def2.hosts && def2.hosts[0].toString({encodeDollar: true})).to.eq('my%24server:123');
    });
});

describe('setDefaults', () => {
    it('must throw on invalid defaults', () => {
        const error = 'Invalid "defaults" parameter: ';
        expect(() => {
            parse('').setDefaults(<{}><unknown>undefined);
        }).to.throw(error + undefined);
        expect(() => {
            parse('').setDefaults(<{}><unknown>123);
        }).to.throw(error + 123);
    });
    it('must set the default protocol', () => {
        expect(parse('').setDefaults({protocol: 'abc'})).to.eql({protocol: 'abc'});
    });
    it('must set the default hostname and port', () => {
        expect(parse('').setDefaults({hosts: [{name: '::', type: HostType.IPv6, port: 1}]})).to.eql({
            hosts: [{
                name: '::',
                type: 'IPv6',
                port: 1
            }]
        });
        expect(parse('my-host').setDefaults({hosts: [{name: 'my-host', port: 0}]})).to.eql({
            hosts: [{
                name: 'my-host',
                type: 'domain'
                // note how invalid port is simply skipped here
            }]
        });
        expect(parse('my-host').setDefaults({hosts: [{name: 'my-host', port: 222}]})).to.eql({
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
        expect(parse(':111').setDefaults({hosts: [{port: 123}]})).to.eql({
            hosts: [{
                port: 111
            }, {port: 123}]
        });
        expect(parse('').setDefaults({hosts: [{name: 'abc'}]})).to.eql({hosts: [{name: 'abc', type: 'domain'}]});
        expect(parse('').setDefaults({hosts: [{port: 123}]})).to.eql({hosts: [{port: 123}]});
    });
    it('must skip invalid hosts', () => {
        expect(parse('my-host').setDefaults({hosts: [{name: '::'}, null]})).to.eql({
            hosts: [{
                name: 'my-host',
                type: 'domain'
            }]
        });
    });
    it('must ignore trailing spaces for host names', () => {
        expect(parse('one').setDefaults({hosts: [{name: ' one '}]})).to.eql({
            hosts: [{name: 'one', type: 'domain'}]
        });
        expect(parse('one').setDefaults({hosts: [{name: ' \t\ttwo\r\n\t '}]})).to.eql({
            hosts: [{name: 'one', type: 'domain'}, {name: 'two', type: 'domain'}]
        });
    });
    it('must ignore invalid ports', () => {
        expect(parse('').setDefaults({hosts: [{port: <number><unknown>'123'}]})).to.eql({});
        expect(parse('').setDefaults({hosts: [{port: <number><unknown>'a'}]})).to.eql({});
        expect(parse('').setDefaults({hosts: [{port: -1}]})).to.eql({});
        expect(parse('').setDefaults({hosts: [{port: <number><unknown>'0'}]})).to.eql({});
        expect(parse('').setDefaults({hosts: [{port: 0}]})).to.eql({});
    });
    it('must set the default user', () => {
        expect(parse('').setDefaults({user: 'abc'})).to.eql({user: 'abc'});
    });
    it('must set the default password', () => {
        expect(parse('').setDefaults({password: 'abc'})).to.eql({password: 'abc'});
    });
    it('must set the default path', () => {
        expect(parse('').setDefaults({path: ['abc']})).to.eql({path: ['abc']});
    });
    it('must set the default params', () => {
        expect(parse('').setDefaults({params: {p1: 'abc'}})).to.eql({params: {p1: 'abc'}});
    });
    it('must skip empty params', () => {
        expect(parse('').setDefaults({params: {}})).to.eql({});
    });
    it('must merge params', () => {
        expect(parse('?value1=1').setDefaults({params: {value1: 0, value2: 2}})).to.eql({
            params: {
                value1: '1',
                value2: 2
            }
        });
    });
    it('must ignore empty path segments', () => {
        expect(parse('').setDefaults({path: <string[]><unknown>['', 123, true, '  ']})).to.eql({});
        expect(parse('').setDefaults({path: <string[]><unknown>123})).to.eql({});
    });
    it('must ignore invalid and empty hosts', () => {
        expect(parse('').setDefaults({hosts: <IHost[]><unknown>1})).to.eql({});
        expect(parse('').setDefaults({hosts: []})).to.eql({});
        expect(parse('').setDefaults({hosts: <IHost[]>[1, 2, 3]})).to.eql({});
        expect(parse('').setDefaults({hosts: [{}, {}, {}]})).to.eql({});
    });
});

describe('parseHost', () => {
    it('must throw on invalid host', () => {
        const error = 'Invalid "host" parameter: ';
        expect(() => {
            parseInvalidHost();
        }).to.throw(error + undefined);
        expect(() => {
            parseInvalidHost(123);
        }).to.throw(error + 123);
    });
    it('must not decode hosts', () => {
        // TODO: should either skip or throw when the host match is partial?
        // expect(parseHost('a b')).to.eql(null);
    });
    it('must allow empty hosts', () => {
        expect(parseHost('')).to.be.null;
        expect(parseHost(':')).to.be.null;
    });
    it('must trim hosts', () => {
        expect(parseHost('      ')).to.be.null;
        expect(parseHost('   :   ')).to.be.null;
        expect(parseHost('\r\n \t  abc\r\n')).to.eql({name: 'abc', type: 'domain'});
    });
    it('must parse valid hosts', () => {
        expect(parseHost('a')).to.eql({name: 'a', type: 'domain'});
        expect(parseHost('a:123')).to.eql({name: 'a', port: 123, type: 'domain'});
        expect(parseHost('1.2.3.4:123')).to.eql({name: '1.2.3.4', port: 123, type: 'IPv4'});
        expect(parseHost('[::]:123')).to.eql({name: '[::]', port: 123, type: 'IPv6'});
        expect(parseHost('a.sock')).to.eql({name: 'a.sock', type: 'socket'});
        expect(parseHost('/a')).to.eql({name: '/a', type: 'socket'});
        expect(parseHost('a/')).to.eql({name: 'a/', type: 'socket'});
    });
});

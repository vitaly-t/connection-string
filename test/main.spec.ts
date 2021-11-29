import {inspect} from 'util';
import {EOL} from 'os';
import {expect} from './header';
import {ConnectionString, IConnectionDefaults, HostType, IHost, IParsedHost} from '../dist';

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
        expect(cs).to.eql({});
    });
    it('must allow null', () => {
        const cs = new ConnectionString(null);
        expect(cs).to.eql({});
    });
    it('must throw when used as a function', () => {
        expect(() => {
            (ConnectionString as any)();
        }).to.throw('Class constructor ConnectionString cannot be invoked without \'new\'');
    });
    it('must throw on invalid connection string', () => {
        const error = 'Invalid connection string: ';
        expect(() => {
            invalidParse(true);
        }).to.throw(error + true);
        expect(() => {
            invalidParse(123);
        }).to.throw(error + 123);
    });
    it('must throw on invalid symbols', () => {
        const invalidSymbols = '~`"#^<>{}\\| \r\n\t';
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
            invalidParse(null, '');
        }).to.throw(error + '""');
        expect(() => {
            invalidParse(null, 123);
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
        expect(parse()).to.eql({});
    });
    it('must allow empty defaults', () => {
        expect(parse('', {})).to.eql({});
    });
});

describe('protocol', () => {
    it('must recognize standard format', () => {
        expect(parse('abc123://')).to.eql({protocol: 'abc123'});
    });
    it('must allow special symbols', () => {
        expect(parse('one+two-three.four:five://')).to.eql({protocol: 'one+two-three.four:five'});
    });
    it('must ignore incomplete format', () => {
        expect(parse('abc:/')).to.eql({hosts: [{name: 'abc', type: 'domain'}]});
        expect(parse('://')).to.eql({});
    });
    it('must throw on invalid symbols', () => {
        expect(() => {
            parse('a$b://');
        }).to.throw('Invalid protocol name: a$b');
        expect(() => {
            parse('a%://');
        }).to.throw('Invalid protocol name: a%');
    });
    it('must throw on leading digits', () => {
        expect(() => {
            parse('123://');
        }).to.throw('Invalid protocol name: 123');
        expect(() => {
            parse('1a://');
        }).to.throw('Invalid protocol name: 1a');
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
        expect(parse('one-1.TWO+23_,three-%3F.gap+here.sock')).to.eql({
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
        }).to.throw(portErrMsg('bad'));
        expect(() => {
            parse('[::]:1a');
        }).to.throw(portErrMsg('1a'));
        expect(() => {
            parse('[::]:abc');
        }).to.throw(portErrMsg('abc'));
    });
    it('must allow valid ports', () => {
        expect(parse('[::]:1')).to.eql({hosts: [{name: '[::]', port: 1, type: 'IPv6'}]});
        expect(parse('[::]:1/')).to.eql({hosts: [{name: '[::]', port: 1, type: 'IPv6'}]});
        expect(parse('[::]:123?')).to.eql({hosts: [{name: '[::]', port: 123, type: 'IPv6'}]});
    });
    it('must allow simplified access to the first host name', () => {
        expect(parse().hostname).to.be.undefined;
        expect(parse('localhost').hostname).to.eq('localhost');
    });
    it('must allow simplified access to the first host type', () => {
        expect(parse().type).to.be.undefined;
        expect(parse('localhost').type).to.eq('domain');
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
        }).to.throw(portErrMsg('0'));
        expect(() => {
            parse(':-1');
        }).to.throw(portErrMsg('-1'));
    });
    it('must not allow invalid terminators', () => {
        expect(() => {
            parse(':12345a');
        }).to.throw(portErrMsg('12345a'));
    });
    it('must allow simplified access to the first port number', () => {
        expect(parse().port).to.be.undefined;
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
    describe('with repeated names', () => {
        it('must join values into array', () => {
            expect(parse('?one=1&one=2&two=3,4&two=5')).to.eql({params: {one: ['1', '2'], two: ['3', '4', '5']}});
            expect(parse('?one=1&one=hello+here,2')).to.eql({params: {one: ['1', 'hello here', '2']}});
        });
        it('must join csv values into array', () => {
            expect(parse('?one=1&one=2,3')).to.eql({params: {one: ['1', '2', '3']}});
            expect(parse('?one=1&one=2,3&one=4,5')).to.eql({params: {one: ['1', '2', '3', '4', '5']}});
            expect(parse('?one=,&one=2,3&one=4,5')).to.eql({params: {one: ['', '', '2', '3', '4', '5']}});
            expect(parse('?one=,&one=1,2&one=,')).to.eql({params: {one: ['', '', '1', '2', '', '']}});
        });
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
    it('must support comma-separated values', () => {
        expect(parse('?one=1,2,3')).to.eql({params: {one: ['1', '2', '3']}});
        expect(parse('?one=,1')).to.eql({params: {one: ['', '1']}});
        expect(parse('?one=1,')).to.eql({params: {one: ['1', '']}});
    });
    it('must convert arrays of values into csv', () => {
        expect(parse('?one=1,2,3').toString()).to.eq('?one=1,2,3');
        expect(create({params: {one: [1, 2, 3]}})).to.eq('?one=1,2,3');
        expect(create({params: {one: [1, 'hello here']}})).to.eq('?one=1,hello%20here');
        expect(create({params: {one: [1, '']}})).to.eq('?one=1,');
        expect(create({params: {one: ['', 1]}})).to.eq('?one=,1');
    });
    it('must treat encoded comma as text', () => {
        expect(parse('?one=1%2C2%2C3')).to.eql({params: {one: '1,2,3'}});
        expect(parse('?one%2C1=1%2C2,3%2C4')).to.eql({params: {'one,1': ['1,2', '3,4']}});
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
        const a = parse();
        a.path = [];
        expect(a.toString()).to.eq('');
    });
    it('must encode params', () => {
        const obj = {
            text: 1,
            values: ['one', true]
        };
        const a = parse(null, {params: {value1: obj, value2: 'text'}});
        const b = parse(a.toString());
        expect(JSON.parse(<string>(b.params && b.params.value1))).to.eql(obj);
    });
    it('must ignore empty parameter list', () => {
        const a = parse();
        a.params = {};
        expect(a.toString()).to.eq('');
    });
    it('must encode dollar symbol when required', () => {
        expect(parse('abc://user$:pa$$@host$name.com/seg$?par$=1$2').toString()).to.eq('abc://user$:pa$$@host$name.com/seg$?par$=1$2');
        expect(parse('abc://user$:pa$$@host$name.com/seg$?par$=1$2').toString({encodeDollar: true})).to.eq('abc://user%24:pa%24%24@host%24name.com/seg%24?par%24=1%242');
    });
    it('must use plus for params when required', () => {
        expect(parse('?a=+1++2').toString()).to.eq('?a=%201%20%202');
        expect(parse('?a=+1++2').toString({plusForSpace: true})).to.eq('?a=+1++2');
    });
    it('must produce an empty string when an empty array is set', () => {
        const a = parse();
        a.hosts = [];
        expect(a.toString()).to.eq('');
    });
    it('must skip empty parameters', () => {
        const a = parse();
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

        const defs = parse().setDefaults({
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

        const def1 = parse().setDefaults({
            hosts: [{
                name: 'my$server',
                port: 123
            }]
        });
        expect(def1.hosts && def1.hosts[0].toString()).to.eq('my$server:123');

        const def2 = parse().setDefaults({
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
            parse().setDefaults(<{}><unknown>undefined);
        }).to.throw(error + undefined);
        expect(() => {
            parse().setDefaults(<{}><unknown>123);
        }).to.throw(error + 123);
    });
    it('must set the default protocol', () => {
        expect(parse().setDefaults({protocol: 'abc'})).to.eql({protocol: 'abc'});
        expect(parse().setDefaults({protocol: null as any})).to.eql({});
    });
    it('must set the default hostname and port', () => {
        expect(parse().setDefaults({hosts: [{name: '::', type: HostType.IPv6, port: 1}]})).to.eql({
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
        expect(parse().setDefaults({hosts: [{name: 'abc'}]})).to.eql({hosts: [{name: 'abc', type: 'domain'}]});
        expect(parse().setDefaults({hosts: [{port: 123}]})).to.eql({hosts: [{port: 123}]});
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
        expect(parse().setDefaults({hosts: [{port: <number><unknown>'123'}]})).to.eql({});
        expect(parse().setDefaults({hosts: [{port: <number><unknown>'a'}]})).to.eql({});
        expect(parse().setDefaults({hosts: [{port: -1}]})).to.eql({});
        expect(parse().setDefaults({hosts: [{port: <number><unknown>'0'}]})).to.eql({});
        expect(parse().setDefaults({hosts: [{port: 0}]})).to.eql({});
    });
    it('must set the default user', () => {
        expect(parse().setDefaults({user: 'abc'})).to.eql({user: 'abc'});
    });
    it('must set the default password', () => {
        expect(parse().setDefaults({password: 'abc'})).to.eql({password: 'abc'});
    });
    it('must set the default path', () => {
        expect(parse().setDefaults({path: ['abc']})).to.eql({path: ['abc']});
    });
    it('must set the default params', () => {
        expect(parse().setDefaults({params: {p1: 'abc'}})).to.eql({params: {p1: 'abc'}});
    });
    it('must skip empty params', () => {
        expect(parse().setDefaults({params: {}})).to.eql({});
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
        expect(parse().setDefaults({path: <string[]><unknown>['', 123, true, '  ']})).to.eql({});
        expect(parse().setDefaults({path: <string[]><unknown>123})).to.eql({});
    });
    it('must ignore invalid and empty hosts', () => {
        expect(parse().setDefaults({hosts: <IHost[]><unknown>1})).to.eql({});
        expect(parse().setDefaults({hosts: []})).to.eql({});
        expect(parse().setDefaults({hosts: <IHost[]>[1, 2, 3]})).to.eql({});
        expect(parse().setDefaults({hosts: [{}, {}, {}]})).to.eql({});
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

        // TODO: host parsing is a bit buggy, needs overhaul
        //    odd/arguable tests:
        // expect(parseHost('123.0.0.1-hello')).to.eql({name: '123.0.0.1-hello', type: 'IPv4'});
        // expect(parseHost('[::]/here')).to.eql({name: '[::]here', type: 'IPv6'});
    });
    it('must use inside spaces', () => {
        expect(parseHost(' a b ')).to.eql({name: 'a b', type: 'domain'});
        expect(parseHost(' / a b ')).to.eql({name: '/ a b', type: 'socket'});
    });
    it('must ignore gaps', () => {
        expect(parseHost('a\tb')).to.eql({name: 'a', type: 'domain'});
        expect(parseHost('a\r\nb')).to.eql({name: 'a', type: 'domain'});
    });
});

describe('virtual properties', () => {
    it('must provide correct values', () => {
        const cs = parse('local:123');
        expect(cs).to.contain({
            host: 'local:123',
            hostname: 'local',
            port: 123,
            type: 'domain'
        });
        expect(cs.host).to.eq('local:123');
        expect(cs.hostname).to.eq('local');
        expect(cs.port).to.eq(123);
        expect(cs.type).to.eq('domain');
    });
    it('must handle empty values', () => {
        const cs = parse();
        expect(cs).to.contain({
            host: undefined,
            hostname: undefined,
            port: undefined,
            type: undefined
        });
        expect(cs.host).to.eq(undefined);
        expect(cs.hostname).to.eq(undefined);
        expect(cs.port).to.eq(undefined);
        expect(cs.type).to.eq(undefined);
    });
});

describe('inspection', () => {
    const cs = parse('local:123');
    const out1 = inspect(cs);
    const out2 = removeColors(out1);
    it('must include virtual properties', () => {
        expect(out2).to.contain(`${EOL}Virtual Properties:`);
        expect(out2).to.contain(`host: 'local:123'`);
        expect(out2).to.contain(`hostname: 'local'`);
        expect(out2).to.contain(`port: 123`);
        expect(out2).to.contain(`type: 'domain'`);
    });
    it('must produce color output', () => {
        expect(out1).to.not.eq(out2);
    });
});

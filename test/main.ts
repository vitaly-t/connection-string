import {ConnectionString, HostType, IHost} from '../src'

const a = new ConnectionString('protocol://');
const b = new ConnectionString('protocol://', {});
const c = new ConnectionString('protocol://', {
    path: ['one', 'two']
});

if ('protocol' in a) {
    const protocol = a.protocol;
    const pass = a.password;
}

const segment1: string = a.path[0];
const param1: string = a.params['first'];

a.params['first'] = 'hello';

a.params = {
    first: '123',
    second: 'hello!'
};

let cs = a.toString({encodeDollar: true, plusForSpace: true, passwordHash: '*'});
a.setDefaults({
    hosts: [
        {name: '[::]', port: 123, type: HostType.IPv4}
    ],
    params: {
        one: 123,
        message: 'hello',
        val: true,
        date: new Date()
    }
});

a.setDefaults({
    user: '',
    password: ''
});

const hostname: string = a.hostname;
const port: number = a.port;

cs = a.toString({encodeDollar: true, plusForSpace: true});

const qq: ConnectionString = a.setDefaults(new ConnectionString(''));

const parseHost: IHost = ConnectionString.parseHost('abc');

parseHost.toString({});


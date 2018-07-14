import {ConnectionString} from '../src'

var a = new ConnectionString('protocol://');
var b = new ConnectionString('protocol://', {});
var c = new ConnectionString('protocol://', {
    segments: ['one', 'two']
});

if ('protocol' in a) {
    var protocol = a.protocol;
}

var segment1: string = a.segments[0];
var param1: string = a.params['first'];

a.params['first'] = 'hello';

a.params = {
    first: '123',
    second: 'hello!'
};

var cs = a.build();
a.setDefaults({});

a.setDefaults({
    user: '',
    password: ''
});

cs = a.build();

var qq: ConnectionString = a.setDefaults(new ConnectionString(''));

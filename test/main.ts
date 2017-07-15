import {ConnectionString} from '../src'

var a = new ConnectionString('protocol://');

if ('protocol' in a) {
    var protocol = a.protocol;
}

var segment1: string = a.segments[0];
var param1: string = a.params['first'];

var cs = a.build();
var cs = a.build({});

cs = a.build({
    hostname: 'server',
    port: 123
});

cs = a.build(new ConnectionString(''));

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var src_1 = require("../src");
var a = new src_1.ConnectionString('protocol://');
var b = new src_1.ConnectionString('protocol://', {});
var c = new src_1.ConnectionString('protocol://', {
    segments: ['one', 'two']
});
if ('protocol' in a) {
    var protocol = a.protocol;
}
var segment1 = a.segments[0];
var param1 = a.params['first'];
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
var qq = a.setDefaults(new src_1.ConnectionString(''));

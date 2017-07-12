import * as parse from '../src'
import {ConnectionOptions} from '../src'

var a: ConnectionOptions = parse('protocol://');

if ('protocol' in a) {
    var protocol = a.protocol;
}

var segment1: string = a.segments[0];
var param1: string = a.params['first'];

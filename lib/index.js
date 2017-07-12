'use strict';

/*
* NOTES:
*
* 1) Must allow everything to be optional
*
* 2) Unlike the old implementation:
*    https://github.com/iceddev/pg-connection-string/blob/master/index.js
*
*    This one will not be using require('url'), as it must work everywhere.
*
* 3) Will also be using decodeURI
*
* 4) OPConverts boolean-like values into actual boolean values (optionally!)
*
* */

(function (window) {
    'use strict';

    function parseConnectionString(cs) {

        if (typeof cs !== 'string') {
            throw new TypeError('Invalid connection string.');
        }

        var result = {
            segments: [],
            params: {}
        };

        // remove trailing spaces:
        cs = trim(cs);

        // extract the protocol:
        var m = cs.match(/^[\w-]*:\/+/);
        if (m) {
            result.protocol = m[0].replace(/:\/*/, '');
            cs = cs.substr(m[0].length);
            if (!result.protocol) {
                throw new TypeError('Invalid \'protocol\' specification.');
            }
        }

        // extract user + password:
        m = cs.match(/^[\w-]*:?[\w-]*@/);
        if (m) {
            var idx = m[0].indexOf(':');
            if (idx === -1) {
                // only the user name is present;
                result.user = m[0].replace(/@/, '');
            } else {
                // both user name + password are present;
                result.user = m[0].substr(0, idx + 1);
                result.password = m[0].substr(idx + 1).replace(/@/, '');
            }
            cs = cs.substr(m[0].length);
        }

        // extract hostname + port:
        // if it starts now with `/`, it is the first segment, or else it is hostname:port
        if (cs[0] !== '/') {
            m = cs.match(/(([^:\/?]*)(?:\:([0-9]+))?)/); // eslint-disable-line
            if (m) {
                if (m[1] && m[1] !== ':') {
                    result.host = m[1];
                }
                if (m[2]) {
                    result.hostname = m[2];
                }
                if (m[3]) {
                    result.port = m[3];
                }
                cs = cs.substr(m[0].length);
            }
        }

        // extract segments:
        m = cs.match(/\/[^/?]+/g);
        if (m) {
            m.forEach(function (s) {
                result.segments.push(s.substr(1));
            });
        }

        // extract parameters:
        var paramIdx = cs.indexOf('?');
        if (paramIdx !== -1) {
            cs = cs.substr(paramIdx + 1);
            m = cs.match(/([^=&?]+)=([^&=?]+)/g);
            if (m) {
                m.forEach(function (s) {
                    var a = s.split('=');
                    result.params[a[0]] = a[1];
                });
            }
        }

        return result;
    }

    function trim(s) {
        return s.replace(/^[\s;]*|[\s;]*$/g, '');
    }

    /* istanbul ignore else */
    if (typeof module === 'object' && module && typeof module.exports === 'object') {
        module.exports = parseConnectionString;
    }
    else {
        window.parseConnectionString = parseConnectionString;
    }
})(this);

//var a = module.exports('/one/two?one=123&two=hello');

//console.log(a);

'use strict';

/*
* NOTES:
*
* 1) Should support client-side
*
* 2) Unlike the old implementation:
*    https://github.com/iceddev/pg-connection-string/blob/master/index.js
*
*    This one will not be using require('url'), as it must work everywhere.
*
* 3) Will also be using decodeURI
*
* 4) Converts boolean-like values into actual boolean values (optionally!)
*
* */

(function (window) {
    'use strict';

    function parseConnectionString(cs) {

        if (typeof cs !== 'string') {
            throw new TypeError('Invalid connection string.');
        }

        var result = {};

        // remove trailing spaces:
        cs = trim(cs);

        // extract the protocol:
        var m = cs.match(/^[\w-]*:\/*/);
        if (m) {
            result.protocol = m[0].replace(/:\/*/, '');
            cs = cs.substr(m[0].length);
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
        m = cs.match(/(([^:\/?]*)(?:\:([0-9]+))?)/); // eslint-disable-line
        if (m) {
            result.host = m[1];
            result.hostname = m[2];
            if (m[0].indexOf(':') !== -1) {
                result.port = m[3];
            }
            cs = cs.substr(m[0].length);
        }

        // extract segments:

        // extract parameters:

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

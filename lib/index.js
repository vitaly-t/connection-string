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
* 4) Converts boolean-like values into actual boolean values
*
* */

// protocol://user:password@host:port/database?ssl=false&application_name=name&fallback_application_name=name&client_encoding=encoding

(function (window) {
    'use strict';

    function parseConnectionString(cs) {

        // root type:
        /*
        var result = {
            protocol: 'postgres',
            user: 'vitaly',
            password: 'pass', // should support special symbols
            hostname: 'localhost',
            host: 'localhost:12345',
            port: 12345,
            sections: ['database'], // all URL sections
            params: {
                // all URL parameters
                ssl: true
            }
        };*/

        var result = {};

        // 1. remove trailing spaces
        cs = trim(cs);

        // 2. extract + remove the protocol:
        var m = cs.match(/^[\w-]*:\/*/);
        if (m) {
            result.protocol = m[0].replace(/:\/*/, '');
            cs = cs.substr(m[0].length);
        }

        // 3. extract user + password:
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

        // 4. extract host + port
        // eslint-disable-next-line
        m = cs.match(/(([^:\/?]*)(?:\:([0-9]+))?)/);
        if (m) {
            result.host = m[1];
            result.hostname = m[2];
            result.port = m[3];
            cs = cs.substr(m[0].length);
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

(function (window) {
    'use strict';

    function parseConnectionString(cs) {

        if (typeof cs !== 'string') {
            throw new TypeError('Invalid connection string!');
        }

        // remove all trailing space symbols:
        cs = cs.replace(/^[\s]*|[\s]*$/g, '');

        var idx = cs.search(/[\s]/);
        if (idx >= 0) {
            // no space symbols allowed inside the URL:
            throw new Error('Invalid URL character at position ' + idx);
        }

        var result = {};

        // extract the protocol:
        var m = cs.match(/^[\w-_.+!*'()$%]*:\/\//);
        if (m) {
            result.protocol = decodeURI(m[0].replace(/:\/\//, ''));
            cs = cs.substr(m[0].length);
            if (!result.protocol) {
                throw new TypeError('Invalid \'protocol\' specification.');
            }
        }

        // extract user + password:
        m = cs.match(/^([\w-_.+!*'()$%]*):?([\w-_.+!*'()$%]*)@/);
        if (m) {
            if (m[1]) {
                result.user = decodeURI(m[1]);
            }
            if (m[2]) {
                result.password = decodeURI(m[2]);
            }
            cs = cs.substr(m[0].length);
        }

        // extract hostname + port:
        // if it starts now with `/`, it is the first segment, or else it is hostname:port
        if (cs[0] !== '/') {
            if (cs[0] === '[') {
                // It is an IPv6, with [::] being the shortest possible
                m = cs.match(/(\[([0-9a-z:%]{2,45})](?::([0-9]+))?)/);
            } else {
                // It is either IPv4 or a name
                m = cs.match(/(([\w-.]*)(?::([0-9]+))?)/);
            }

            if (m) {
                if (m[1]) {
                    result.host = m[1];
                }
                if (m[2]) {
                    result.hostname = m[2];
                }
                if (m[3]) {
                    result.port = parseInt(m[3]);
                }
                cs = cs.substr(m[0].length);
            }
        }

        // extract segments:
        m = cs.match(/\/([\w-_.+!*'()$%]+)/g);
        if (m) {
            result.segments = m.map(function (s) {
                return decodeURI(s.substr(1));
            });
        }

        // extract parameters:
        idx = cs.indexOf('?');
        if (idx !== -1) {
            cs = cs.substr(idx + 1);
            m = cs.match(/([\w-_.+!*'()$%]+)=([\w-_.+!*'()$%]+)/g);
            if (m) {
                result.params = {};
                m.forEach(function (s) {
                    var a = s.split('=');
                    result.params[decodeURI(a[0])] = decodeURI(a[1]);
                });
            }
        }

        return result;
    }

    /* istanbul ignore else */
    if (typeof module === 'object' && module && typeof module.exports === 'object') {
        module.exports = parseConnectionString;
    }
    else {
        window.parseConnectionString = parseConnectionString;
    }
})(this);

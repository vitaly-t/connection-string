(function (window) {
    'use strict';

    function ConnectionString(cs) {

        if (!(this instanceof ConnectionString)) {
            return new ConnectionString(cs);
        }

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

        // extract the protocol:
        var m = cs.match(/^[\w-_.+!*'()$%]*:\/\//);
        if (m) {
            var protocol = decodeURI(m[0].replace(/:\/\//, ''));
            if (protocol) {
                this.protocol = protocol;
            }
            cs = cs.substr(m[0].length);
        }

        // extract user + password:
        m = cs.match(/^([\w-_.+!*'()$%]*):?([\w-_.+!*'()$%]*)@/);
        if (m) {
            if (m[1]) {
                this.user = decodeURI(m[1]);
            }
            if (m[2]) {
                this.password = decodeURI(m[2]);
            }
            cs = cs.substr(m[0].length);
        }

        // extract hostname + port:
        // if it starts now with `/`, it is the first segment, or else it is hostname:port
        if (cs[0] !== '/') {
            if (cs[0] === '[') {
                // It is an IPv6, with [::] being the shortest possible
                m = cs.match(/(\[([0-9a-z:%]{2,45})](?::([0-9]+))?)/i);
            } else {
                // It is either IPv4 or a name
                m = cs.match(/(([a-z0-9.-]*)(?::([0-9]+))?)/i);
            }
            if (m) {
                if (m[1]) {
                    this.host = m[1];
                }
                if (m[2]) {
                    this.hostname = m[2];
                }
                if (m[3]) {
                    this.port = parseInt(m[3]);
                }
                cs = cs.substr(m[0].length);
            }
        }

        // extract segments:
        m = cs.match(/\/([\w-_.+!*'()$%]+)/g);
        if (m) {
            this.segments = m.map(function (s) {
                return decodeURI(s.substr(1));
            });
        }

        // extract parameters:
        idx = cs.indexOf('?');
        if (idx !== -1) {
            cs = cs.substr(idx + 1);
            m = cs.match(/([\w-_.+!*'()$%]+)=([\w-_.+!*'()$%]+)/g);
            if (m) {
                var params = {};
                m.forEach(function (s) {
                    var a = s.split('=');
                    params[decodeURI(a[0])] = decodeURI(a[1]);
                });
                this.params = params;
            }
        }
    }

    function build() {
        var s = '';
        if (this.protocol) {
            s += encodeURI(this.protocol) + '://';
        }
        if (this.user) {
            s += encodeURI(this.user);
            if (this.password) {
                s += ':' + encodeURI(this.password);
            }
            s += '@';
        } else {
            if (this.password) {
                s += ':' + encodeURI(this.password) + '@';
            }
        }
        if (this.host) {
            s += this.host;
        }
        if (Array.isArray(this.segments) && this.segments.length) {
            this.segments.forEach(function (seg) {
                s += '/' + encodeURI(seg);
            });
        }
        if (this.params) {
            var params = [];
            for (var a in this.params) {
                params.push(encodeURI(a) + '=' + encodeURI(this.params[a]));
            }
            if (params.length) {
                s += '?' + params.join('&');
            }
        }
        return s;
    }

    Object.defineProperty(ConnectionString.prototype, 'build', {value: build});

    /* istanbul ignore else */
    if (typeof module === 'object' && module && typeof module.exports === 'object') {
        module.exports = ConnectionString;
    }
    else {
        window.ConnectionString = ConnectionString;
    }
})(this);

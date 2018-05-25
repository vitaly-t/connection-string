(function (window) {
    'use strict';

    var encode = encodeURIComponent;
    var decode = decodeURIComponent;
    var invalidDefaults = 'Invalid \'defaults\' parameter!';

    function ConnectionString(cs, defaults) {

        if (!(this instanceof ConnectionString)) {
            return new ConnectionString(cs, defaults);
        }

        if (typeof cs !== 'string') {
            throw new TypeError('Invalid connection string!');
        }

        if (defaults !== undefined && defaults !== null && typeof defaults !== 'object') {
            throw new TypeError(invalidDefaults);
        }

        // remove all trailing space symbols:
        cs = trim(cs);

        var idx = cs.search(/[\s]/);
        if (idx >= 0) {
            // no space symbols allowed inside the URL:
            throw new Error('Invalid URL character at position ' + idx);
        }

        // extract the protocol:
        var m = cs.match(/^[\w-_.+!*'()$%]*:\/\//);
        if (m) {
            var protocol = decode(m[0].replace(/:\/\//, ''));
            if (protocol) {
                this.protocol = protocol;
            }
            cs = cs.substr(m[0].length);
        }

        // extract user + password:
        m = cs.match(/^([\w-_.+!*'()$%]*):?([\w-_.+!*'()$%]*)@/);
        if (m) {
            if (m[1]) {
                this.user = decode(m[1]);
            }
            if (m[2]) {
                this.password = decode(m[2]);
            }
            cs = cs.substr(m[0].length);
        }

        // extract hostname + port:
        // if it starts now with `/`, it is the first segment, or else it is hostname:port
        if (cs[0] !== '/') {
            if (cs[0] === '[') {
                // It is an IPv6, with [::] being the shortest possible
                m = cs.match(/(\[([0-9a-z:%]{2,45})](?::([0-9]+[^/?]*))?)/i);
            } else {
                // It is either IPv4 or a name
                m = cs.match(/(([a-z0-9.-]*)(?::([0-9]+[^/?]*))?)/i);
            }
            if (m) {
                if (m[2]) {
                    this.hostname = m[2];
                }
                if (m[3]) {
                    var p = m[3], port = parseInt(p);
                    if (port >= 0 && port <= 65535 && port.toString() === p) {
                        this.port = port;
                    } else {
                        throw new Error('Invalid port: ' + p);
                    }
                }
                if (this.hostname || this.port >= 0) {
                    this.host = '';
                    if (this.hostname) {
                        this.host = cs[0] === '[' ? ('[' + this.hostname + ']') : this.hostname;
                    }
                    if (this.port >= 0) {
                        this.host += ':' + this.port;
                    }
                }
                cs = cs.substr(m[0].length);
            }
        }

        // extract segments:
        m = cs.match(/\/([\w-_.+!*'()$%]+)/g);
        if (m) {
            this.segments = m.map(function (s) {
                return decode(s.substr(1));
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
                    params[decode(a[0])] = decode(a[1]);
                });
                this.params = params;
            }
        }

        if (defaults) {
            this.setDefaults(defaults);
        }
    }

    function build() {
        var s = '';
        if (this.protocol) {
            s += encode(this.protocol) + '://';
        }
        if (this.user) {
            s += encode(this.user);
            if (this.password) {
                s += ':' + encode(this.password);
            }
            s += '@';
        } else {
            if (this.password) {
                s += ':' + encode(this.password) + '@';
            }
        }
        if (this.host) {
            s += this.host;
        }
        if (Array.isArray(this.segments) && this.segments.length) {
            this.segments.forEach(function (seg) {
                s += '/' + encode(seg);
            });
        }
        if (this.params) {
            var params = [];
            for (var a in this.params) {
                var value = this.params[a];
                if (typeof value !== 'string') {
                    value = JSON.stringify(value);
                }
                params.push(encode(a) + '=' + encode(value));
            }
            if (params.length) {
                s += '?' + params.join('&');
            }
        }
        return s;
    }

    function setDefaults(defaults) {
        if (!defaults || typeof defaults !== 'object') {
            throw new TypeError(invalidDefaults);
        }
        if (!('protocol' in this) && isText(defaults.protocol)) {
            this.protocol = trim(defaults.protocol);
        }
        if (!('host' in this) && isText(defaults.host)) {
            this.host = trim(defaults.host);
        }
        if (!('hostname' in this) && isText(defaults.hostname)) {
            this.hostname = trim(defaults.hostname);
        }
        var p = defaults.port;
        if (!('port' in this) && Number.isInteger(p) && p >= 0 && p <= 65535) {
            this.port = p;
        }
        if (!('user' in this) && isText(defaults.user)) {
            this.user = trim(defaults.user);
        }
        if (!('password' in this) && isText(defaults.password)) {
            this.password = trim(defaults.password);
        }
        if (!('segments' in this) && Array.isArray(defaults.segments)) {
            var s = defaults.segments.filter(isText);
            if (s.length) {
                this.segments = s;
            }
        }
        if (defaults.params && typeof defaults.params === 'object') {
            var keys = Object.keys(defaults.params);
            if (keys.length) {
                if (this.params) {
                    for (var a in defaults.params) {
                        if (!(a in this.params)) {
                            this.params[a] = defaults.params[a];
                        }
                    }
                } else {
                    this.params = {};
                    for (var b in defaults.params) {
                        this.params[b] = defaults.params[b];
                    }
                }
            }
        }
        if (this.port || this.hostname) {
            this.host = (this.hostname || '') + (this.port >= 0 ? (':' + this.port) : '');
        }
        return this;
    }

    function isText(txt) {
        return txt && typeof txt === 'string' && /\S/.test(txt);
    }

    function trim(txt) {
        return txt.replace(/^[\s]*|[\s]*$/g, '');
    }

    Object.defineProperty(ConnectionString.prototype, 'build', {value: build});
    Object.defineProperty(ConnectionString.prototype, 'setDefaults', {value: setDefaults});

    ConnectionString.ConnectionString = ConnectionString;

    /* istanbul ignore else */
    if (typeof module === 'object' && module && typeof module.exports === 'object') {
        module.exports = ConnectionString;
    }
    else {
        window.ConnectionString = ConnectionString;
    }
})(this);

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

        // extract hosts details:
        // if it starts now with `/`, it is the first segment, or else it is the first host:port
        if (cs[0] !== '/') {

            var endOfHosts = cs.search(/\/|\?/);

            var hosts = (endOfHosts === -1 ? cs : cs.substr(0, endOfHosts)).split(',');

            for (var i = 0; i < hosts.length; i++) {
                var host = hosts[i];
                var h = {}, isIPv6 = false;

                if (host[0] === '[') {
                    // It is an IPv6, with [::] being the shortest possible
                    m = host.match(/(\[([0-9a-z:%]{2,45})](?::(-?[0-9]+[^/?]*))?)/i);
                    isIPv6 = true;
                } else {
                    // It is either IPv4 or a name
                    m = host.match(/(([a-z0-9%.-]*)(?::(-?[0-9]+[^/?]*))?)/i);
                }
                if (m) {
                    if (m[2]) {
                        h.name = isIPv6 ? m[2] : decode(m[2]);
                        h.isIPv6 = isIPv6;
                    }
                    if (m[3]) {
                        var p = m[3], port = parseInt(p);
                        if (port > 0 && port < 65536 && port.toString() === p) {
                            h.port = port;
                        } else {
                            throw new Error('Invalid port: ' + p);
                        }
                    }
                    if (h.name || h.port) {
                        if (!this.hosts) {
                            this.hosts = [];
                        }
                        this.hosts.push(h);
                    }
                }
            }
            if (endOfHosts >= 0) {
                cs = cs.substr(endOfHosts);
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
        if (Array.isArray(this.hosts)) {
            s += this.hosts.map(fullHostName).join();
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
        if (Array.isArray(defaults.hosts)) {
            var hosts = Array.isArray(this.hosts) ? this.hosts : [];
            var obj, found;
            defaults.hosts.forEach(function (dh) {
                found = false;
                for (var i = 0; i < hosts.length; i++) {
                    var thisHost = fullHostName(hosts[i]), defHost = fullHostName(dh);
                    if (equalStrings(thisHost, defHost)) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    obj = {};
                    if (isText(dh.name)) {
                        obj.name = dh.name;
                        obj.isIPv6 = !!dh.isIPv6;
                    }
                    var port = parseInt(dh.port);
                    if (port > 0 && port < 65536) {
                        obj.port = port;
                    }
                    hosts.push(obj);
                }
            });
            if (obj) {
                this.hosts = hosts; // if anything changed;
            }
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
                if (this.params && typeof(this.params) === 'object') {
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
        return this;
    }

    function fullHostName(obj) {
        var a = '';
        if (obj.name) {
            if (obj.isIPv6) {
                a = '[' + obj.name + ']';
            } else {
                a = encode(obj.name);
            }
        }
        if (obj.port) {
            a += ':' + obj.port;
        }
        return a;
    }

    function isText(txt) {
        return typeof txt === 'string' && /\S/.test(txt);
    }

    function trim(txt) {
        return txt.replace(/^[\s]*|[\s]*$/g, '');
    }

    function equalStrings(str1, str2) {
        return (typeof str1 === 'string' && typeof str2 === 'string') && str1.toUpperCase() === str2.toUpperCase();
    }

    Object.defineProperty(ConnectionString.prototype, 'build', {value: build});
    Object.defineProperty(ConnectionString.prototype, 'setDefaults', {value: setDefaults});

    ConnectionString.ConnectionString = ConnectionString; // to make it more TypeScript-friendly

    /* istanbul ignore else */
    if (typeof module === 'object' && module && typeof module.exports === 'object') {
        module.exports = ConnectionString; // inside Node.js
    }
    else {
        window.ConnectionString = ConnectionString; // inside a browser
    }
})(this);

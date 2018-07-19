(function (window) {
    'use strict';

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

        // Removing all trailing space symbols:
        cs = trim(cs);

        // Validating URL symbols:
        validateUrl(cs);

        // Extracting the protocol:
        var m = cs.match(/^[\w-_.+!*'()$%]*:\/\//);
        if (m) {
            var protocol = decode(m[0].replace(/:\/\//, ''));
            if (protocol) {
                this.protocol = protocol;
            }
            cs = cs.substr(m[0].length);
        }

        // Extracting user + password:
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

        // Extracting hosts details...
        // (if it starts with `/`, it is the first path segment, so no hosts specified)
        if (cs[0] !== '/') {

            var endOfHosts = cs.search(/\/|\?/);
            var hosts = (endOfHosts === -1 ? cs : cs.substr(0, endOfHosts)).split(',');

            hosts.forEach(function (h) {
                var host = parseHost(h);
                if (host) {
                    if (!this.hosts) {
                        this.hosts = [];
                    }
                    this.hosts.push(host);
                }
            }, this);

            if (endOfHosts >= 0) {
                cs = cs.substr(endOfHosts);
            }
        }

        // Extracting the path:
        m = cs.match(/\/([\w-_.+!*'()$%]+)/g);
        if (m) {
            this.path = m.map(function (s) {
                return decode(s.substr(1));
            });
        }

        // Extracting parameters:
        var idx = cs.indexOf('?');
        if (idx !== -1) {
            cs = cs.substr(idx + 1);
            m = cs.match(/([\w-_.+!*'()$%]+)=([\w-_.+!*'()$%]+)/g);
            if (m) {
                var params = {};
                m.forEach(function (s) {
                    var a = s.split('=');
                    var value = a[1].replace(/\+/g, ' ');
                    params[decode(a[0])] = decode(value);
                });
                this.params = params;
            }
        }

        if (defaults) {
            this.setDefaults(defaults);
        }
    }

    function validateUrl(url) {
        var idx = url.search(/[^A-Za-z0-9-._~:/?[\]@!$&'()*+,;=%]/);
        if (idx >= 0) {
            var s = JSON.stringify(url[idx]).replace(/^"|"$/g, '\'');
            throw new Error('Invalid URL character ' + s + ' at position ' + idx);
        }
    }

    function parseHost(host, external) {
        if (external) {
            if (typeof host !== 'string') {
                throw new TypeError('Invalid \'host\' parameter!');
            }
            host = trim(host);
        }
        var m, isIPv6 = false;
        if (host[0] === '[') {
            // This is IPv6, with [::] being the shortest possible
            m = host.match(/(\[([0-9a-z:%]{2,45})](?::(-?[0-9]+[^/?]*))?)/i);
            isIPv6 = true;
        } else {
            // It is either IPv4 or a name
            m = host.match(/(([a-z0-9%.$-]*)(?::(-?[0-9]+[^/?]*))?)/i);
        }
        if (m) {
            var h = {};
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
                Object.defineProperty(h, 'toString', {
                    value: function (options) {
                        return fullHostName(h, options);
                    }
                });
                return h;
            }
        }
        return null;
    }

    function toString(options) {
        var s = '';
        options = options || {};
        if (this.protocol) {
            s += encode(this.protocol, options) + '://';
        }
        if (this.user) {
            s += encode(this.user, options);
            if (this.password) {
                s += ':' + encode(this.password, options);
            }
            s += '@';
        } else {
            if (this.password) {
                s += ':' + encode(this.password, options) + '@';
            }
        }
        if (Array.isArray(this.hosts)) {
            s += this.hosts.map(function (h) {
                return fullHostName(h, options);
            }).join();
        }
        if (Array.isArray(this.path) && this.path.length) {
            this.path.forEach(function (seg) {
                s += '/' + encode(seg, options);
            });
        }
        if (this.params) {
            var params = [];
            for (var a in this.params) {
                var value = this.params[a];
                if (typeof value !== 'string') {
                    value = JSON.stringify(value);
                }
                params.push(encode(a, options) + '=' + encode(value, options));
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

        // Missing default hosts are merged with the existing ones:
        if (Array.isArray(defaults.hosts)) {
            var hosts = Array.isArray(this.hosts) ? this.hosts : [];
            defaults.hosts.filter(function (d) {
                return d && typeof d === 'object';
            })
                .forEach(function (dh) {
                    var found = false;
                    for (var i = 0; i < hosts.length; i++) {
                        var thisHost = fullHostName(hosts[i]), defHost = fullHostName(dh);
                        if (equalStrings(thisHost, defHost)) {
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        var obj = {};
                        if (isText(dh.name)) {
                            obj.name = dh.name;
                            obj.isIPv6 = !!dh.isIPv6;
                        }
                        var port = parseInt(dh.port);
                        if (port > 0 && port < 65536) {
                            obj.port = port;
                        }
                        if (obj.name || obj.port) {
                            Object.defineProperty(obj, 'toString', {
                                value: function (options) {
                                    return fullHostName(obj, options);
                                }
                            });
                            hosts.push(obj);
                        }
                    }
                });
            if (hosts.length) {
                this.hosts = hosts;
            }
        }

        if (!('user' in this) && isText(defaults.user)) {
            this.user = trim(defaults.user);
        }

        if (!('password' in this) && isText(defaults.password)) {
            this.password = trim(defaults.password);
        }

        // Since the order of path segments is usually important, we set default
        // path segments as they are, but only when they are missing completely:
        if (!('path' in this) && Array.isArray(defaults.path)) {
            var s = defaults.path.filter(isText);
            if (s.length) {
                this.path = s;
            }
        }

        // Missing default params are merged with the existing ones:
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

    function fullHostName(obj, options) {
        options = options || {};
        var a = '';
        if (obj.name) {
            if (obj.isIPv6) {
                a = '[' + obj.name + ']';
            } else {
                a = encode(obj.name, options);
            }
        }
        if (obj.port) {
            a += ':' + obj.port;
        }
        return a;
    }

    function encode(text, options) {
        text = encodeURIComponent(text);
        return options.encodeDollar ? text : text.replace(/%24/g, '$');
    }

    function decode(text) {
        return decodeURIComponent(text);
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

    Object.defineProperty(ConnectionString.prototype, 'toString', {value: toString});
    Object.defineProperty(ConnectionString.prototype, 'setDefaults', {value: setDefaults});
    Object.defineProperty(ConnectionString, 'parseHost', {
        value: function (host) {
            return parseHost(host, true);
        }
    });

    ConnectionString.ConnectionString = ConnectionString; // To make it TypeScript-friendly

    /* istanbul ignore else */
    if (typeof module === 'object' && module && typeof module.exports === 'object') {
        module.exports = ConnectionString; // Inside Node.js
    }
    else {
        window.ConnectionString = ConnectionString; // Inside a browser
    }
})(this);

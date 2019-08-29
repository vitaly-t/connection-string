import {HostType, IConnectionDefaults, IEncodingOptions, IHost, IParsedHost} from './types';
import {decode, encode, fullHostName, isText} from './utils';

const errInvalidDefaults = 'Invalid "defaults" parameter: ';

export class ConnectionString {

    protocol?: string;
    hosts?: Array<IParsedHost>;
    user?: string;
    password?: string;
    path?: string[];
    params?: { [name: string]: string };

    /**
     * Virtualized accessor to the first host name.
     */
    get hostname(): string | undefined {
        return this.hosts && this.hosts[0].name;
    }

    /**
     * Virtualized accessor to the first host's port.
     */
    get port(): number | undefined {
        return this.hosts && this.hosts[0].port;
    }

    constructor(cs: string, defaults?: IConnectionDefaults) {

        if (!(this instanceof ConnectionString)) {
            return new ConnectionString(cs, defaults);
        }

        if (typeof cs !== 'string') {
            throw new TypeError('Invalid connection string: ' + JSON.stringify(cs));
        }

        if (defaults !== undefined && defaults !== null && typeof defaults !== 'object') {
            throw new TypeError(errInvalidDefaults + JSON.stringify(defaults));
        }

        cs = cs.trim();

        ConnectionString.validateUrl(cs);

        // Extracting the protocol:
        let m = cs.match(/^[\w-_.+!*'()$%:]*:\/\//);
        if (m) {
            const protocol = m[0].replace(/:\/\//, '');
            if (protocol) {
                this.protocol = decode(protocol);
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

        // Extracting hosts details:
        // (if it starts with `/`, it is the first path segment, no hosts specified)
        if (cs[0] !== '/') {

            const endOfHosts = cs.search(/\/|\?/);
            const hosts = (endOfHosts === -1 ? cs : cs.substr(0, endOfHosts)).split(',');

            hosts.forEach(h => {
                const host = ConnectionString.parseInnerHost(h);
                if (host) {
                    if (!this.hosts) {
                        this.hosts = [];
                    }
                    this.hosts.push(host);
                }
            });

            if (endOfHosts >= 0) {
                cs = cs.substr(endOfHosts);
            }
        }

        // Extracting the path:
        m = cs.match(/\/([\w-_.+!*'()$%]+)/g);
        if (m) {
            this.path = m.map(s => decode(s.substr(1)));
        }

        // Extracting parameters:
        const idx = cs.indexOf('?');
        if (idx !== -1) {
            cs = cs.substr(idx + 1);
            m = cs.match(/([\w-_.+!*'()$%]+)=([\w-_.+!*'()$%]+)/g);
            if (m) {
                const params: { [name: string]: string } = {};
                m.forEach(s => {
                    const a = s.split('=');
                    const prop = decode(a[0]);
                    if (prop in params) {
                        throw new Error('Parameter "' + prop + '" is repeated.');
                    }
                    params[prop] = decode(a[1]);
                });
                this.params = params;
            }
        }

        if (defaults) {
            this.setDefaults(defaults);
        }

    }

    private static validateUrl(url: string): void {
        const idx = url.search(/[^A-Za-z0-9-._~:/?[\]@!$&'()*+,;=%]/);
        if (idx >= 0) {
            const s = JSON.stringify(url[idx]).replace(/^"|"$/g, '\'');
            throw new Error('Invalid URL character ' + s + ' at position ' + idx);
        }
    }

    static parseHost(host: string): IParsedHost | null {
        return ConnectionString.parseInnerHost(host, true);
    }

    private static parseInnerHost(host: string, raw?: boolean): IParsedHost | null {
        if (raw) {
            if (typeof host !== 'string') {
                throw new TypeError('Invalid "host" parameter: ' + JSON.stringify(host));
            }
            host = host.trim();
        }
        let m, isIPv6;
        if (host[0] === '[') {
            // This is IPv6, with [::] being the shortest possible
            m = host.match(/((\[[0-9a-z:%]{2,45}])(?::(-?[0-9a-z]+))?)/i);
            isIPv6 = true;
        } else {
            // It is either IPv4 or domain/socket
            if (raw) {
                m = host.match(/(([a-z0-9.$/-]*)(?::(-?[0-9a-z]+))?)/i);
            } else {
                m = host.match(/(([a-z0-9.$%-]*)(?::(-?[0-9a-z]+))?)/i);
            }
        }
        if (m) {
            const h: IHost = {};
            if (m[2]) {
                if (isIPv6) {
                    h.name = m[2];
                    h.type = HostType.IPv6;
                } else {
                    if (m[2].match(/([0-9]{1,3}\.){3}[0-9]{1,3}/)) {
                        h.name = m[2];
                        h.type = HostType.IPv4;
                    } else {
                        h.name = raw ? m[2] : decode(m[2]);
                        h.type = h.name.match(/\/|.*\.sock$/i) ? HostType.socket : HostType.domain;
                    }
                }
            }
            if (m[3]) {
                const p = m[3], port = parseInt(p);
                if (port > 0 && port < 65536 && port.toString() === p) {
                    h.port = port;
                } else {
                    throw new Error('Invalid port number: ' + JSON.stringify(p));
                }
            }
            if (h.name || h.port) {
                Object.defineProperty(h, 'toString', {
                    value: (options: IEncodingOptions) => fullHostName(h, options)
                });
                return h;
            }
        }
        return null;
    }

    toString(options?: IEncodingOptions): string {
        let s = '';
        const opts = <IEncodingOptions>options || {};

        if (this.protocol) {
            s += encode(this.protocol, opts).replace(/%3A/g, ':') + '://';
        }
        if (this.user || this.password) {
            if (this.user) {
                s += encode(this.user, opts);
            }
            if (this.password) {
                s += ':';
                const h = opts.passwordHash;
                if (h) {
                    const code = (typeof h === 'string' && h[0]) || '#';
                    s += new Array(this.password.length + 1).join(code);
                } else {
                    s += encode(this.password, opts);
                }
            }
            s += '@';
        }
        if (Array.isArray(this.hosts)) {
            s += this.hosts.map(h => fullHostName(h, options)).join();
        }
        if (Array.isArray(this.path)) {
            this.path.forEach(seg => {
                s += '/' + encode(seg, opts);
            });
        }
        if (this.params && typeof this.params === 'object') {
            const params = [];
            for (const a in this.params) {
                let value = this.params[a];
                if (typeof value !== 'string') {
                    value = JSON.stringify(value);
                }
                value = encode(value, opts);
                if (opts.plusForSpace) {
                    value = value.replace(/%20/g, '+');
                }
                params.push(encode(a, opts) + '=' + value);
            }
            if (params.length) {
                s += '?' + params.join('&');
            }
        }
        return s;
    }

    setDefaults(defaults: IConnectionDefaults): this {
        if (!defaults || typeof defaults !== 'object') {
            throw new TypeError(errInvalidDefaults + JSON.stringify(defaults));
        }

        if (!('protocol' in this) && isText(defaults.protocol)) {
            this.protocol = defaults.protocol && defaults.protocol.trim(); // TODO: non-optimal
        }

        // Missing default hosts are merged with the existing ones:
        if (Array.isArray(defaults.hosts)) {
            const hosts = Array.isArray(this.hosts) ? this.hosts : [];
            defaults.hosts.filter(d => {
                return d && typeof d === 'object';
            })
                .forEach(dh => {
                    const dhName = isText(dh.name) && dh.name ? dh.name.trim() : undefined; // TODO: non-optimal
                    const h: IHost = {name: dhName, port: dh.port, type: dh.type};
                    let found = false;
                    for (let i = 0; i < hosts.length; i++) {
                        const thisHost = fullHostName(hosts[i]), defHost = fullHostName(h);
                        if (thisHost.toLowerCase() === defHost.toLowerCase()) {
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        const obj: IParsedHost = {};
                        if (h.name) {
                            if (h.type && h.type in HostType) {
                                obj.name = h.name;
                                obj.type = h.type;
                            } else {
                                const t = ConnectionString.parseInnerHost(h.name, true);
                                if (t) {
                                    obj.name = t.name;
                                    obj.type = t.type;
                                }
                            }
                        }
                        const p = h.port;
                        if (typeof p === 'number' && p > 0 && p < 65536) {
                            obj.port = p;
                        }
                        if (obj.name || obj.port) {
                            Object.defineProperty(obj, 'toString', {
                                value: (options: IEncodingOptions) => fullHostName(obj, options)
                            });
                            hosts.push(obj);
                        }
                    }
                });
            if (hosts.length) {
                this.hosts = hosts;
            }
        }

        if (!('user' in this) && defaults.user && isText(defaults.user)) {
            this.user = defaults.user.trim();
        }

        if (!('password' in this) && defaults.password && isText(defaults.password)) {
            this.password = defaults.password.trim();
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
            const keys = Object.keys(defaults.params);
            if (keys.length) {
                if (this.params && typeof (this.params) === 'object') {
                    for (const a in defaults.params) {
                        if (!(a in this.params)) {
                            this.params[a] = defaults.params[a];
                        }
                    }
                } else {
                    this.params = {};
                    for (const b in defaults.params) {
                        this.params[b] = defaults.params[b];
                    }
                }
            }
        }
        return this;
    }
}

(function () {
    // hiding prototype members:
    ['setDefaults', 'toString', 'hostname', 'port'].forEach(prop => {
        let desc = <PropertyDescriptor>Object.getOwnPropertyDescriptor(ConnectionString.prototype, prop);
        desc.enumerable = false;
        Object.defineProperty(ConnectionString.prototype, prop, desc);
    });
})();

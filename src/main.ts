import {inspect} from 'util';
import {EOL} from 'os';
import {HostType, IConnectionDefaults, IEncodingOptions, IHost, IParsedHost} from './types';
import {decode, encode, hasText, fullHostName, parseHost, validateUrl} from './static';

const errInvalidDefaults = `Invalid "defaults" parameter: `;

export class ConnectionString {

    /**
     * Connection protocol, if specified,
     * or else the property does not exist.
     */
    protocol?: string;

    /**
     * User name, if specified,
     * or else the property does not exist.
     */
    user?: string;

    /**
     * User password, if specified,
     * or else the property does not exist.
     */
    password?: string;

    /**
     * List of parsed hosts, if at least one is specified,
     * or else the property does not exist.
     */
    hosts?: IParsedHost[];

    /**
     * Url path segments, if at least one is specified,
     * or else the property does not exist.
     */
    path?: string[];

    /**
     * Url parameters, if at least one is specified,
     * or else the property does not exist.
     */
    params?: { [name: string]: any };

    /**
     * Safe read-accessor to the first host's name.
     */
    get hostname(): string | undefined {
        return this.hosts?.[0].name;
    }

    /**
     * Safe read-accessor to the first host's port.
     */
    get port(): number | undefined {
        return this.hosts?.[0].port;
    }

    /**
     * Safe read-accessor to the first host's type.
     */
    get type(): HostType | undefined {
        return this.hosts?.[0].type;
    }

    /**
     * Constructor.
     *
     * @param cs - connection string (can be empty).
     *
     * @param defaults - optional defaults, which can also be set
     * explicitly, via method setDefaults.
     */
    constructor(cs?: string | null, defaults?: IConnectionDefaults) {

        if (!(this instanceof ConnectionString)) {
            throw new TypeError(`Class constructor ConnectionString cannot be invoked without 'new'`);
        }

        cs = cs ?? '';

        if (typeof cs as any !== 'string') {
            throw new TypeError(`Invalid connection string: ${JSON.stringify(cs)}`);
        }

        if (typeof (defaults ?? {}) !== 'object') {
            throw new TypeError(errInvalidDefaults + JSON.stringify(defaults));
        }

        cs = cs.trim();

        validateUrl(cs); // will throw, if failed

        // Extracting the protocol:
        let m = cs.match(/^(.*)?:\/\//);
        if (m) {
            const p = m[1]; // protocol name
            if (p) {
                const m2 = p.match(/^([a-z]+[a-z0-9+-.]*)/i);
                if (p && (!m2 || m2[1] !== p)) {
                    throw new Error(`Invalid protocol name: ${p}`);
                }
                this.protocol = p;
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
        // (if it starts with `/`, it is the first path segment, i.e. no hosts specified)
        if (cs[0] !== '/') {

            const endOfHosts = cs.search(/[\/?]/);
            const hosts = (endOfHosts === -1 ? cs : cs.substr(0, endOfHosts)).split(',');

            hosts.forEach(h => {
                const host = parseHost(h);
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
                        throw new Error(`Parameter "${prop}" repeated.`);
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

    /**
     * Parses a host name into an object, which then can be passed into `setDefaults`.
     *
     * It returns `null` only when no valid host recognized.
     */
    static parseHost(host: string): IParsedHost | null {
        return parseHost(host, true);
    }

    /**
     * Converts this object into a valid connection string.
     */
    toString(options?: IEncodingOptions): string {
        let s = this.protocol ? `${this.protocol}://` : ``;
        const opts = <IEncodingOptions>options || {};

        if (this.user || this.password) {
            if (this.user) {
                s += encode(this.user, opts);
            }
            if (this.password) {
                s += ':';
                const h = opts.passwordHash;
                if (h) {
                    const code = (typeof h === 'string' && h[0]) || '#';
                    s += code.repeat(this.password.length);
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
                s += `/${encode(seg, opts)}`;
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
                params.push(`${encode(a, opts)}=${value}`);
            }
            if (params.length) {
                s += `?${params.join('&')}`;
            }
        }
        return s;
    }

    /**
     * Applies default parameters, and returns itself.
     */
    setDefaults(defaults: IConnectionDefaults): this {
        if (!defaults || typeof defaults !== 'object') {
            throw new TypeError(errInvalidDefaults + JSON.stringify(defaults));
        }

        if (!('protocol' in this) && hasText(defaults.protocol)) {
            this.protocol = defaults.protocol && defaults.protocol.trim();
        }

        // Missing default `hosts` are merged with the existing ones:
        if (Array.isArray(defaults.hosts)) {
            const hosts = Array.isArray(this.hosts) ? this.hosts : [];
            const dhHosts = defaults.hosts.filter(d => d && typeof d === 'object') as IHost[];
            dhHosts.forEach(dh => {
                const dhName = hasText(dh.name) ? dh.name!.trim() : undefined;
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
                            const t = parseHost(h.name, true);
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

        if (!('user' in this) && hasText(defaults.user)) {
            this.user = defaults.user!.trim();
        }

        if (!('password' in this) && hasText(defaults.password)) {
            this.password = defaults.password!.trim();
        }

        // Since the order of `path` segments is usually important, we set default
        // `path` segments as they are, but only when they are missing completely:
        if (!('path' in this) && Array.isArray(defaults.path)) {
            const s = defaults.path.filter(hasText);
            if (s.length) {
                this.path = s;
            }
        }

        // Missing default `params` are merged with the existing ones:
        if (defaults.params && typeof defaults.params === 'object') {
            const keys = Object.keys(defaults.params);
            if (keys.length) {
                if (this.params && typeof this.params === 'object') {
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
    // hiding prototype members, to keep the type signature clean:
    ['setDefaults', 'toString', 'hostname', 'port', 'type'].forEach(prop => {
        const desc = <PropertyDescriptor>Object.getOwnPropertyDescriptor(ConnectionString.prototype, prop);
        desc.enumerable = false;
        Object.defineProperty(ConnectionString.prototype, prop, desc);
    });

    let inspecting = false;
    // istanbul ignore else
    if (inspect.custom) {
        Object.defineProperty(ConnectionString.prototype, inspect.custom, {
            value() {
                if (inspecting) {
                    return this;
                }
                inspecting = true;
                const options = {colors: process.stdout.isTTY};
                const src = inspect(this, options);
                const {hostname, port, type} = this;
                const vp = inspect({hostname, port, type}, options);
                inspecting = false;
                return `${src}${EOL}Virtual Properties: ${vp}`;
            }
        });
    }
})();

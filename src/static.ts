import {HostType, IEncodingOptions, IHost, IParsedHost} from './types';

export function fullHostName(obj: IHost, options?: IEncodingOptions): string {
    let a = '';
    if (obj.name) {
        const skipEncoding = obj.type === HostType.IPv4 || obj.type === HostType.IPv6;
        a = skipEncoding ? obj.name : encode(obj.name, options ?? {});
    }
    if (obj.port) {
        a += `:${obj.port}`;
    }
    return a;
}

export function encode(text: string, options: IEncodingOptions): string {
    text = encodeURIComponent(text);
    if (options.plusForSpace) {
        text = text.replace(/%20/g, '+');
    }
    return options.encodeDollar ? text : text.replace(/%24/g, '$');
}

export function decode(text: string): string {
    return decodeURIComponent(text.replace(/\+/g, '%20'));
}

export function hasText(txt?: string): boolean {
    return typeof txt === 'string' && /\S/.test(txt);
}

export function validateUrl(url: string): void {
    const idx = url.search(/[^a-z0-9-._:\/?[\]@!$&'()*+,;=%]/i);
    if (idx >= 0) {
        const s = JSON.stringify(url[idx]).replace(/^"|"$/g, `'`);
        throw new Error(`Invalid URL character ${s} at position ${idx}`);
    }
}

export function parseHost(host: string, direct?: boolean): IParsedHost | null {
    if (direct) {
        if (typeof host as any !== 'string') {
            throw new TypeError(`Invalid "host" parameter: ${JSON.stringify(host)}`);
        }
        host = host.trim();
    }
    let m, isIPv6;
    if (host[0] === '[') {
        // This is IPv6, with [::] being the shortest possible
        m = host.match(/((\[[0-9a-z:%_]{2,45}])(?::(-?[0-9a-z]+))?)/i);
        isIPv6 = true;
    } else {
        // It is either IPv4 or domain/socket
        if (direct) {
            // Allowed directly: ForwardSlash + Space
            m = host.match(/(([a-z0-9.$/\- _]*)(?::(-?[0-9a-z]+))?)/i);
        } else {
            // Allow when indirectly: + and %
            m = host.match(/(([a-z0-9.+$%\-_]*)(?::(-?[0-9a-z]+))?)/i);
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
                    h.name = direct ? m[2] : decode(m[2]);
                    h.type = h.name.match(/\/|.*\.sock$/i) ? HostType.socket : HostType.domain;
                }
            }
        }
        if (m[3]) {
            const p = m[3], port = parseInt(p);
            if (port > 0 && port < 65536 && port.toString() === p) {
                h.port = port;
            } else {
                throw new Error(`Invalid port: ${JSON.stringify(p)}. Valid port range is: [1...65535]`);
            }
        }
        if (h.name || h.port) {
            Object.defineProperty(h, 'toString', {
                value: (options: IEncodingOptions) => fullHostName(h, options),
                enumerable: false
            });
            return h;
        }
    }
    return null;
}

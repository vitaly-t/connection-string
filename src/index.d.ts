declare enum HostType {
    domain, // Regular domain name
    socket, // UNIX socket
    IPv4,
    IPv6
}

interface IEncodingOptions {
    encodeDollar?: boolean
    plusForSpace?: boolean
    passwordHash?: boolean | string
}

interface IHost {
    name?: string
    port?: number
    type?: HostType
    toString?: (options?: IEncodingOptions) => string
}

interface IConnectionDefaults {
    protocol?: string
    hosts?: Array<IHost>
    user?: string
    password?: string
    path?: string[]
    params?: { [name: string]: any }
}

export class ConnectionString {
    constructor(cs: string, defaults?: IConnectionDefaults)

    protocol?: string;
    hosts?: Array<IHost>;
    user?: string;
    password?: string;
    path?: string[];
    params?: { [name: string]: any };

    /**
     * Virtualized accessor to the first host name:
     * = hosts && hosts[0].name
     */
    readonly hostname?: string;

    /**
     * Virtualized accessor to the first host's port:
     * = hosts && hosts[0].port
     */
    readonly port?: number;

    static parseHost(host: string): IHost | null

    toString(options?: IEncodingOptions): string

    setDefaults(defaults: IConnectionDefaults): ConnectionString
}

declare enum HostType {
    domain = 'domain',
    socket = 'socket',
    IPv4 = 'IPv4',
    IPv6 = 'IPv6'
}

interface IEncodingOptions {
    encodeDollar?: boolean
    plusForSpace?: boolean
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
    params?: { [name: string]: string }
}

export class ConnectionString {
    constructor(cs: string, defaults?: IConnectionDefaults)

    protocol?: string;
    hosts?: Array<IHost>;
    user?: string;
    password?: string;
    path?: string[];
    params?: { [name: string]: string };

    static parseHost(host: string): IHost

    toString(options?: IEncodingOptions): string

    setDefaults(defaults: IConnectionDefaults): ConnectionString
}

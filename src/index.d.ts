interface IEncodingOptions {
    encodeDollar?: boolean
}

interface IHost {
    name?: string
    port?: number
    isIPv6?: boolean
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

interface IHost {
    name?: string
    port?: number
    isIPv6?: boolean
    toString?: () => string
}

interface IConnectionDefaults {
    protocol?: string
    hosts?: Array<IHost>;
    user?: string
    password?: string
    segments?: string[]
    params?: { [name: string]: string }
}

export class ConnectionString {
    constructor(cs: string, defaults?: IConnectionDefaults)

    protocol?: string;
    hosts?: Array<IHost>;
    user?: string;
    password?: string;
    segments?: string[];
    params?: { [name: string]: string };

    toString(): string;

    setDefaults(defaults: IConnectionDefaults): ConnectionString;
}

interface IHost {
    name?: string
    port?: number
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

    build(): string;

    setDefaults(defaults: IConnectionDefaults): ConnectionString;
}

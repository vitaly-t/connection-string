interface IConnectionDefaults {
    protocol?: string
    hostname?: string
    port?: number
    user?: string
    password?: string
    segments?: string[]
    params?: { [name: string]: string }
}

export class ConnectionString {
    constructor(cs: string, defaults?: IConnectionDefaults)

    protocol?: string;
    host?: string;
    hostname?: string;
    port?: number;
    user?: string;
    password?: string;
    segments?: string[];
    params?: { [name: string]: string };

    build(): string;

    setDefaults(defaults: IConnectionDefaults): ConnectionString;
}

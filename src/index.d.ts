interface IConnectionString {
    protocol?: string
    user?: string
    password?: string
    host?: string
    hostname?: string
    port?: number
    segments?: string[]
    params?: { [name: string]: any }
}

export class ConnectionString implements IConnectionString {
    constructor(cd: string, defaults?: IConnectionString)

    protocol: string;
    user: string;
    password: string;
    host: string;
    hostname: string;
    port: number;
    segments: string[];
    params: { [name: string]: any };

    build(): string;

    setDefaults(defaults: IConnectionString): ConnectionString;
}

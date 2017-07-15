interface IConnectionString {
    protocol?: string
    user?: string
    password?: string
    host?: string
    hostname?: string
    port?: number
    segments?: string[]
    params?: { [name: string]: string }
}

export class ConnectionString implements IConnectionString {
    constructor(cd: string)

    protocol: string;
    user: string;
    password: string;
    host: string;
    hostname: string;
    port: number;
    segments: string[];
    params: { [name: string]: string };

    build(defaults?: IConnectionString): string;
}

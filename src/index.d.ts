export class ConnectionString {
    constructor(cd: string)

    protocol: string;
    user: string;
    password: string;
    host: string;
    hostname: string;
    port: number;
    segments: string[];
    params: { [name: string]: string };

    build(): string;
}

declare namespace ConnectionString {

    interface ConnectionOptions {
        protocol: string
        user: string
        password: string
        host: string
        hostname: string
        port: number
        segments: string[]
        params: { [name: string]: string }
    }
}

declare function ConnectionString(cs: string): ConnectionString.ConnectionOptions;

export = ConnectionString;

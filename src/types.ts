export enum HostType {
    domain, // Regular domain name
    socket, // UNIX socket
    IPv4,
    IPv6
}

export interface IEncodingOptions {
    encodeDollar?: boolean
    plusForSpace?: boolean
    passwordHash?: boolean | string
}

export interface IHost {
    name?: string
    port?: number
    type?: HostType
}

export interface IParsedHost extends IHost {
    type: HostType
    toString: (options?: IEncodingOptions) => string
}

export interface IConnectionDefaults {
    protocol?: string
    hosts?: Array<IHost>
    user?: string
    password?: string
    path?: string[]
    params?: { [name: string]: any }
}

import {IConnectionDefaults} from "./types";

export class ConnectionString {
    constructor(cs: string, defaults?: IConnectionDefaults)

    protocol?: string;
    hosts?: Array<IParsedHost>;
    user?: string;
    password?: string;
    path?: string[];
    params?: { [name: string]: any };

    /**
     * Virtualized accessor to the first host name:
     * = hosts && hosts[0].name
     */
    readonly hostname?: string;

    /**
     * Virtualized accessor to the first host's port:
     * = hosts && hosts[0].port
     */
    readonly port?: number;

    static parseHost(host: string): IParsedHost | null

    toString(options?: IEncodingOptions): string

    setDefaults(defaults: IConnectionDefaults): ConnectionString
}

import {HostType, IEncodingOptions, IHost} from './types';

export function fullHostName(obj: IHost, options?: IEncodingOptions): string {
    options = options || {};
    let a = '';
    if (obj.name) {
        const skipEncoding = obj.type === HostType.IPv4 || obj.type === HostType.IPv6;
        a = skipEncoding ? obj.name : encode(obj.name, options);
    }
    if (obj.port) {
        a += ':' + obj.port;
    }
    return a;
}

export function encode(text: string, options: IEncodingOptions): string {
    text = encodeURIComponent(text);
    if (options.plusForSpace) {
        text = text.replace(/%20/g, '+');
    }
    return options.encodeDollar ? text : text.replace(/%24/g, '$');
}

export function decode(text: string): string {
    return decodeURIComponent(text.replace(/\+/g, '%20'));
}

export function isText(txt: any): boolean {
    return typeof txt === 'string' && /\S/.test(txt);
}

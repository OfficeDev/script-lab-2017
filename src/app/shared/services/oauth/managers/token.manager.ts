import { Storage, StorageType } from '../helpers/storage';

export interface IToken {
    provider: string;
    id_token?: string;
    access_token?: string;
    refresh_token?: string;
    token_type?: string;
    scope?: string;
    state?: string;
    expires_in?: string;
    expires_at?: Date;
}

export interface ICode {
    provider: string;
    code: string;
    scope?: string;
    state?: string;
}

export interface IError {
    error: string;
    state?: string;
}

/**
 * Helper for caching and managing OAuth Tokens.
 */
export class TokenManager extends Storage<IToken> {
    /**
     * @constructor                  
    */
    constructor() {
        super('OAuth2Tokens', StorageType.LocalStorage);
    }

    /**
     * Compute the expiration date based on the expires_in field in a OAuth token.          
     */
    setExpiry(token: IToken) {
        var expire = (seconds: any = 3600) => new Date(new Date().getTime() + ~~seconds * 1000);
        if (token == null) return null;
        if (token.expires_at == null) {
            token.expires_at = expire(token.expires_in);
        }
    }

    /**
     * Extends Storage's default add method
     * Adds a new OAuth Token after settings its expiry
     *
     * @param {string} provider Unique name of the corresponding OAuth Endpoint.
     * @param {object} config valid Token
     * @see {@link IEndpoint}.
     * @return {object} Returns the added endpoint.
     */
    add(provider: string, value: IToken) {
        value.provider = provider;
        this.setExpiry(value);
        return super.add(provider, value);
    }

    /**
     * Extract the token from the URL
     *
     * @param {string} url The url to extract the token from.
     * @param {string} exclude Exclude a particlaur string from the url, such as a query param or specific substring.
     * @param {string} delimiter[optional] Delimiter used by OAuth provider to mark the beginning of token response. Defaults to #.
     * @return {object} Returns the extracted token.
     */
    static getToken(url: string, exclude?: string, delimiter: string = '#'): ICode | IToken | IError {
        if (exclude) url = url.replace(exclude, '');

        let parts = url.split(delimiter);
        if (parts.length <= 0) return;

        let rightPart = parts.length >= 2 ? parts[1] : parts[0];
        rightPart = rightPart.replace('/', '');

        if (rightPart.indexOf("?") !== -1) {
            let queryPart = rightPart.split("?");
            if (!queryPart || queryPart.length <= 0) return;
            rightPart = queryPart[1];
        }

        return this._extractParams(rightPart);
    }

    /**
     * Check if the supplied url has either access_token or code or error 
     */
    static isTokenUrl(url: string) {
        var regex = /(access_token|code|error)/gi;
        return regex.test(url);
    }

    private static _extractParams(segment: string): ICode | IToken | IError {
        let params: any = {},
            regex = /([^&=]+)=([^&]*)/g,
            matches;

        while ((matches = regex.exec(segment)) !== null) {
            params[decodeURIComponent(matches[1])] = decodeURIComponent(matches[2]);
        }

        return params;
    }
}
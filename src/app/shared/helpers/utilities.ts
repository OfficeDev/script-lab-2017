import * as _ from 'lodash';

export class Utilities {
    static guid() {
        try {
            let pad = (number: number) => {
                let hex: string = number.toString(16);
                while (hex.length < 4) {
                    hex = `0${hex}`;
                }
                return hex;
            };

            let buf: Uint16Array = new Uint16Array(8);
            let crypto = window.crypto || (window as any).msCrypto;
            crypto.getRandomValues(buf);
            return `${pad(buf[0])}${pad(buf[1])}-${pad(buf[2])}-${pad(buf[3])}-${pad(buf[4])}-${pad(buf[5])}${pad(buf[6])}${pad(buf[7])}`;
        }
        catch (exception) {
            // TODO: Handle failed GUID generation
        }
    }
}


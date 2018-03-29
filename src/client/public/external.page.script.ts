import { Authenticator } from '@microsoft/office-js-helpers';
import { forIn } from 'lodash';
const { safeExternalUrls } = PLAYGROUND;

(() => {
    const params = Authenticator.extractParams(window.location.href.split('?')[1]) || {};
    let destination = params['destination'];

    forIn(safeExternalUrls, (value: string): any => {
        if (value === destination) {
            window.location.href = destination;
            return false;
        }
    });

    // Otherwise can just stay on empty page.  This should never happen in normal behavior,
    // and if someone tweaks the URL, then so be it.
})();

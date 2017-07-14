import { Strings } from '../app/strings';
import { instantiateRibbon } from '../app/helpers';

(() => {
    const strings = Strings();

    document.title = strings.HtmlPageStrings.PageTitles.code;

    let subtitle = document.getElementById('subtitle');
    subtitle.textContent = strings.playgroundTagline;
    subtitle.style.visibility = 'visible';

    let chooseHost = document.getElementById('choose-your-host');
    chooseHost.textContent = strings.HtmlPageStrings.chooseYourHost;
    chooseHost.style.visibility = 'visible';

    instantiateRibbon('ribbon');

    // Note: inspired by Modernizr's check for localStorage existence:
    //   https://github.com/Modernizr/Modernizr
    try {
        const key = 'playground_localstorage_test';
        window.localStorage.setItem(key, '');
        window.localStorage.removeItem(key);
    } catch (e) {
        let errorText = strings.HtmlPageStrings.localStorageUnavailableMessage;
        console.log(errorText);

        document.getElementsByClassName('ms-progress-component__sub-title')[0].textContent = errorText;
        (document.getElementsByClassName('ms-progress-component__sub-title')[0] as HTMLElement).style.maxWidth = '350px';
        (document.getElementsByClassName('ms-progress-component__footer')[0] as HTMLElement).style.display = 'none';

        // Re-throw the exception (english is OK, it's dev-only), blocking further execution...
        throw new Error('localStorage is disabled');
    }

})();

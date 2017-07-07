import { Strings } from '../app/strings';
import { environment } from '../app/helpers';
let { config } = PLAYGROUND;

(() => {
    const strings = Strings();

    document.title = strings.HtmlPageStrings.PageTitles.code;

    document.getElementById('subtitle').textContent = strings.playgroundTagline;
    document.getElementById('subtitle').style.visibility = 'visible';

    document.getElementById('choose-your-host').textContent = strings.HtmlPageStrings.chooseYourHost;
    document.getElementById('choose-your-host').style.visibility = 'visible';

    let ribbons = document.getElementsByClassName('ribbon');
    for (let i = 0; i < ribbons.length; i++) {
        let ribbon = ribbons[i] as HTMLElement;
        switch (environment.current.config.name) {
            case config['insiders'].name:
                ribbon.textContent = 'Beta';
                ribbon.style.background = 'red';
                break;
            case config['edge'].name:
                ribbon.textContent = 'Alpha';
                ribbon.style.background = 'blue';
                break;
            case config['local'].name:
                ribbon.textContent = config['local'].editorUrl;
                ribbon.style.background = 'green';
                break;
            default:
                break;
        }

        if (environment.current.config.name !== config['production'].name) {
            ribbon.style.visibility = 'visible';
        }
    }


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

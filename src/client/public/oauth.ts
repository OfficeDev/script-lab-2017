import { environment, applyTheme } from '../../app/helpers';
import { Strings } from '../../app/strings';
import '../assets/styles/extras.scss';

(async () => {
    await environment.initialize();
    await applyTheme(environment.current.host);


    const strings = Strings();

    document.title = strings.playgroundName + ' - ' + strings.HtmlPageStrings.PageTitles.authenticationRedirect;

    document.getElementById('subtitle').textContent = strings.HtmlPageStrings.authenticatingOnBehalfOfSnippet;
    document.getElementById('subtitle').style.visibility = 'visible';

    document.getElementById('choose-your-host').textContent = strings.HtmlPageStrings.chooseYourHost;
    document.getElementById('choose-your-host').style.visibility = 'visible';
})();


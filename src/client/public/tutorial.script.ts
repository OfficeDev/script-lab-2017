import { Strings } from '../app/strings';

(() => {
    const strings = Strings();

    document.title = strings.HtmlPageStrings.PageTitles.tutorial;

    document.getElementById('tutorial-description').textContent = strings.HtmlPageStrings.tutorialDescription;
    document.getElementById('download-word').textContent = strings.HtmlPageStrings.download;

    document.getElementById('main-body').style.visibility = 'visible';
})();

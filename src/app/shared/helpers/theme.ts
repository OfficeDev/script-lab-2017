import { ContextTypes, Utilities } from './utilities';
import { Storage } from '@microsoft/office-js-helpers';

export class Theme {
    static get themeColor() {
        switch (Utilities.context) {
            case ContextTypes.Excel:
                return '#217346';
            case ContextTypes.Word:
                return '#2b579a';
            case ContextTypes.PowerPoint:
                return '#d04526';
            case ContextTypes.OneNote:
                return '#80397b';
            default:
                return '#0478d7';
        }
    }

    static get themeColorDarker() {
        switch (Utilities.context) {
            case ContextTypes.Excel:
                return '#164b2e';
            case ContextTypes.Word:
                return '#204072';
            case ContextTypes.PowerPoint:
                return '#a5371e';
            case ContextTypes.OneNote:
                return '#5d2959';
            default:
                return '#0360AF';
        }
    }

    static applyTheme(): Promise<boolean> {
        return new Promise(resolve => {
            let context = ContextTypes[Utilities.context].toLowerCase();
            let body = document.querySelector('body');

            if (context === 'web') {
                (require as any).ensure(['./assets/styles/themes/generic.scss'], () => {
                    body.classList.add('generic');
                    return resolve(true);
                });
            }
            else if (context === 'word_old') {
                (require as any).ensure(['./assets/styles/themes/word.scss'], () => {
                    body.classList.add('word');
                    return resolve(true);
                });
            }
            else {
                (require as any).ensure([`./assets/styles/themes/${context}.scss`], () => {
                    body.classList.add(context);
                    return resolve(true);
                });
            }
        });
    }
}

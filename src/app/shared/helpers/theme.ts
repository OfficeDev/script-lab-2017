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
            let body = document.querySelector('body');

            switch (Utilities.context) {
                case ContextTypes.Excel:
                    (require as any).ensure(['../../../assets/styles/themes/excel.scss'], () => {
                        body.classList.add('excel');
                        return resolve(true);
                    });
                    break;

                case ContextTypes.Word_Old:
                case ContextTypes.Word:
                    (require as any).ensure(['../../../assets/styles/themes/word.scss'], () => {
                        body.classList.add('word');
                        return resolve(true);
                    });
                    break;

                case ContextTypes.PowerPoint:
                    (require as any).ensure(['../../../assets/styles/themes/powerpoint.scss'], () => {
                        body.classList.add('powerpoint');
                        return resolve(true);
                    });
                    break;

                case ContextTypes.OneNote:
                    (require as any).ensure(['../../../assets/styles/themes/onenote.scss'], () => {
                        body.classList.add('onenote');
                        return resolve(true);
                    });
                    break;

                case ContextTypes.Web:
                default:
                    (require as any).ensure(['../../../assets/styles/themes/generic.scss'], () => {
                        body.classList.add('generic');
                        return resolve(true);
                    });
                    break;
            }
        });
    }
}

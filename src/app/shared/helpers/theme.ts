import { Storage, ContextTypes, Utilities } from '@microsoft/office-js-helpers';

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
                    (require as any)(['style!raw!postcss!sass!../../../assets/styles/themes/excel.scss'], file => {
                        return resolve(true);
                    });
                    break;

                case ContextTypes.Word:
                    (require as any)(['style!raw!postcss!sass!../../../assets/styles/themes/word.scss'], file => {
                        return resolve(true);
                    });
                    break;

                case ContextTypes.PowerPoint:
                    (require as any)(['style!raw!postcss!sass!../../../assets/styles/themes/powerpoint.scss'], file => {
                        return resolve(true);
                    });
                    break;

                case ContextTypes.OneNote:
                    (require as any)(['style!raw!postcss!sass!../../../assets/styles/themes/onenote.scss'], file => {
                        return resolve(true);
                    });
                    break;

                case ContextTypes.Web:
                default:
                    (require as any)(['style!raw!postcss!sass!../../../assets/styles/themes/web.scss'], file => {
                        return resolve(true);
                    });
                    break;
            }
        });
    }
}

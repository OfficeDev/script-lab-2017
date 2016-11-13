import { Storage, HostTypes, Utilities } from '@microsoft/office-js-helpers';

export class Theme {
    static applyTheme(): Promise<boolean> {
        return new Promise(resolve => {
            let body = document.querySelector('body');

            switch (Utilities.host) {
                case HostTypes.Excel:
                    (require as any)(['style!raw!postcss!sass!../../../assets/styles/themes/excel.scss'], file => {
                        return resolve(true);
                    });
                    break;

                case HostTypes.Word:
                    (require as any)(['style!raw!postcss!sass!../../../assets/styles/themes/word.scss'], file => {
                        return resolve(true);
                    });
                    break;

                case HostTypes.PowerPoint:
                    (require as any)(['style!raw!postcss!sass!../../../assets/styles/themes/powerpoint.scss'], file => {
                        return resolve(true);
                    });
                    break;

                case HostTypes.OneNote:
                    (require as any)(['style!raw!postcss!sass!../../../assets/styles/themes/onenote.scss'], file => {
                        return resolve(true);
                    });
                    break;

                case HostTypes.Web:
                default:
                    (require as any)(['style!raw!postcss!sass!../../../assets/styles/themes/web.scss'], file => {
                        return resolve(true);
                    });
                    break;
            }
        });
    }
}

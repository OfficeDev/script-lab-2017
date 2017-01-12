import { HostType, Utilities } from '@microsoft/office-js-helpers';

export class Theme {
    static applyTheme(): Promise<boolean> {
        return new Promise(resolve => {
            switch (Utilities.host) {
                case HostType.EXCEL:
                    (require as any)(['style!raw!postcss!sass!../../assets/styles/themes/excel.scss'], file => {
                        return resolve(true);
                    });
                    break;

                case HostType.WORD:
                    (require as any)(['style!raw!postcss!sass!../../assets/styles/themes/word.scss'], file => {
                        return resolve(true);
                    });
                    break;

                case HostType.POWERPOINT:
                    (require as any)(['style!raw!postcss!sass!../../assets/styles/themes/powerpoint.scss'], file => {
                        return resolve(true);
                    });
                    break;

                case HostType.ONENOTE:
                    (require as any)(['style!raw!postcss!sass!../../assets/styles/themes/onenote.scss'], file => {
                        return resolve(true);
                    });
                    break;

                case HostType.WEB:
                default:
                    (require as any)(['style!raw!postcss!sass!../../assets/styles/themes/web.scss'], file => {
                        return resolve(true);
                    });
                    break;
            }
        });
    }
}

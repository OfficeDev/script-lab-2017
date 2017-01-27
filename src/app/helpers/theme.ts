import { HostType } from '@microsoft/office-js-helpers';

export class Theme {
    static applyTheme(host: string): Promise<boolean> {
        return new Promise(resolve => {
            switch (host.toUpperCase()) {
                case HostType.EXCEL:
                    (require as any)(['style!raw!postcss!sass!../../assets/styles/themes/excel.scss'], () => {
                        return resolve(true);
                    });
                    break;

                case HostType.WORD:
                    (require as any)(['style!raw!postcss!sass!../../assets/styles/themes/word.scss'], () => {
                        return resolve(true);
                    });
                    break;

                case HostType.POWERPOINT:
                    (require as any)(['style!raw!postcss!sass!../../assets/styles/themes/powerpoint.scss'], () => {
                        return resolve(true);
                    });
                    break;

                case HostType.ONENOTE:
                    (require as any)(['style!raw!postcss!sass!../../assets/styles/themes/onenote.scss'], () => {
                        return resolve(true);
                    });
                    break;

                case HostType.WEB:
                default:
                    (require as any)(['style!raw!postcss!sass!../../assets/styles/themes/web.scss'], () => {
                        return resolve(true);
                    });
                    break;
            }
        });
    }
}

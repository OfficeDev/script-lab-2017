import { Storage, HostTypes, Utilities } from '@microsoft/office-js-helpers';

export class Theme {
    static _editorTheme: string;

    static get editorTheme() {
        if (Theme._editorTheme == null) {
            let store = new Storage<string>('Playground');
            Theme._editorTheme = store.get('Theme') || 'vs';
        }

        return this._editorTheme;
    };

    static set editorTheme(value: string) {
        let body = document.querySelector('body');
        body.classList.remove(Theme.editorTheme);
        Theme._editorTheme = value || 'vs';
        let store = new Storage<string>('Playground');
        store.insert('Theme', Theme._editorTheme);
        body.classList.add(Theme.editorTheme);
    }

    static applyTheme(): Promise<boolean> {
        return new Promise(resolve => {
            let body = document.querySelector('body');
            body.classList.add(Theme.editorTheme);

            switch (Utilities.host) {
                case HostTypes.EXCEL:
                    (require as any)(['style!raw!postcss!sass!../../assets/styles/themes/excel.scss'], file => {
                        return resolve(true);
                    });
                    break;

                case HostTypes.WORD:
                    (require as any)(['style!raw!postcss!sass!../../assets/styles/themes/word.scss'], file => {
                        return resolve(true);
                    });
                    break;

                case HostTypes.POWERPOINT:
                    (require as any)(['style!raw!postcss!sass!../../assets/styles/themes/powerpoint.scss'], file => {
                        return resolve(true);
                    });
                    break;

                case HostTypes.ONENOTE:
                    (require as any)(['style!raw!postcss!sass!../../assets/styles/themes/onenote.scss'], file => {
                        return resolve(true);
                    });
                    break;

                case HostTypes.WEB:
                default:
                    (require as any)(['style!raw!postcss!sass!../../assets/styles/themes/web.scss'], file => {
                        return resolve(true);
                    });
                    break;
            }
        });
    }
}

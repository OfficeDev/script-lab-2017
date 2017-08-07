import { HostType } from '@microsoft/office-js-helpers';

export function applyTheme(host: string): Promise<boolean> {
    return new Promise(resolve => {
        switch (host.toUpperCase()) {
            case HostType.EXCEL:
                (require as any).ensure([], (require) => {
                    require(['style-loader!raw-loader!postcss-loader!sass-loader!../../assets/styles/themes/excel.scss'], () => {
                        resolve(true);
                    });
                });
                break;

            case HostType.WORD:
                (require as any).ensure([], (require) => {
                    require(['style-loader!raw-loader!postcss-loader!sass-loader!../../assets/styles/themes/word.scss'], () => {
                        resolve(true);
                    });
                });
                break;

            case HostType.POWERPOINT:
                (require as any).ensure([], (require) => {
                    require(['style-loader!raw-loader!postcss-loader!sass-loader!../../assets/styles/themes/powerpoint.scss'], () => {
                        resolve(true);
                    });
                });
                break;

            case HostType.ONENOTE:
                (require as any).ensure([], (require) => {
                    require(['style-loader!raw-loader!postcss-loader!sass-loader!../../assets/styles/themes/onenote.scss'], () => {
                        resolve(true);
                    });
                });
                break;

            case HostType.PROJECT:
                (require as any).ensure([], (require) => {
                    require(['style-loader!raw-loader!postcss-loader!sass-loader!../../assets/styles/themes/project.scss'], () => {
                        resolve(true);
                    });
                });
                break;

            case 'TEAMS':
                (require as any).ensure([], (require) => {
                    require(['style-loader!raw-loader!postcss-loader!sass-loader!../../assets/styles/themes/teams.scss'], () => {
                        resolve(true);
                    });
                });
                break;

            case HostType.OUTLOOK:
                (require as any).ensure([], (require) => {
                    require(['style-loader!raw-loader!postcss-loader!sass-loader!../../assets/styles/themes/outlook.scss'], () => {
                        resolve(true);
                    });
                });
                break;

            case HostType.WEB:
            default:
                (require as any).ensure([], (require) => {
                    require(['style-loader!raw-loader!postcss-loader!sass-loader!../../assets/styles/themes/web.scss'], () => {
                        resolve(true);
                    });
                });
                break;
        }
    });
}

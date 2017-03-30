import { Observable } from 'rxjs/Observable';
import { debounce } from 'lodash';

class Router {
    onHashChange$: Observable<IUrlParams> = new Observable(observer => {
        const _listener = debounce((event: HashChangeEvent) => {
            try {
                let params = this.current;
                if (!(params == null)) {
                    observer.next(params);
                }
            }
            catch (e) {
                observer.error(e);
            }
        }, 300);

        window.addEventListener('hashchange', _listener, false);

        return () => {
            window.removeEventListener('hashchange', _listener, false);
        };
    });

    get mode() {
        return (this.current && this.current.mode) || 'EDIT';
    }

    get current() {
        let params = this._getParams();
        if (!(params == null) && params.host && params.host.trim() !== '') {
            return params;
        }
        else {
            return null;
        }
    }

    updateHash({ host, id, mode, store }: IUrlParams): string {
        let hash = '';
        if (mode === 'VIEW') {
            hash = `#/${host}/${mode}/${store}/${id}`;
        }
        else {
            hash = `#/${host}/${mode}/${id || ''} `;
        }

        location.hash = hash.toLowerCase();
        return location.hash;
    }

    private _getParams() {
        const [host, mode, store, id] = location.hash.toLowerCase().replace('#/', '').split('/');

        if (host == null) {
            return null;
        }

        return {
            host: host.toUpperCase(),
            mode: mode.toUpperCase() as any,
            id: mode === 'VIEW' ? id : store,
            store: (mode === 'VIEW' ? store : undefined) as any
        };
    }
}

export const router = new Router();

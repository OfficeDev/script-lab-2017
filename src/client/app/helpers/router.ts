import { Observable } from 'rxjs/Observable';
import { debounce } from 'lodash';

class Router {
    private _default: IUrlParams = {
        mode: 'EDIT',
        host: null,
        id: null,
        store: null
    };

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

    get current() {
        let params = this._getParams();
        if (!(params == null) && params.host && params.host.trim() !== '') {
            return { ...this._default, ...params };
        }
        else {
            return this._default;
        }
    }

    updateHash(params: IUrlParams): string {
        const updatedParams = { ...this.current, ...params };
        const { host, id, mode, store } = updatedParams;

        if (host == null || mode == null) {
            return null;
        }

        if (mode === 'VIEW') {
            location.hash = `#/${host}/${mode}/${store}/${id}`.toLowerCase();
        }
        else {
            location.hash = `#/${host}/${mode}/${store}/${id}`.toLowerCase();
        }

        return location.hash;
    }

    private _getParams() {
        const { hash } = location;

        if (hash == null || hash.trim() === '') {
            return null;
        }

        const [host, mode, store, id] = hash.toLowerCase().replace('#/', '').split('/');

        if (host == null) {
            return null;
        }

        return {
            host: host.toUpperCase(),
            mode: mode.toUpperCase() as any,
            id: id && id.toLowerCase(),
            store: store && store.toUpperCase()
        };
    }
}

export const router = new Router();

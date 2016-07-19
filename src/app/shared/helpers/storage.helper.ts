import {Repository, IRepository, IDictionary, Utils} from './';

export enum StorageTypes {
    LocalStorage,
    SessionStorage
}

export class StorageHelper<T> extends Repository<T>{
    private _storage = null;

    constructor(private _container: string, type?: StorageTypes) {
        super();
        type = type || StorageTypes.LocalStorage;
        this.switchStorage(type);
    }

    switchStorage(type: StorageTypes) {
        this._storage = type === StorageTypes.LocalStorage ? localStorage : sessionStorage;
        if (!_.has(this._storage, this._container)) {
            this._storage[this._container] = "";
        }

        this._load();
    }

    add(item: string, value: T): T {
        if (Utils.isEmpty(item) || Utils.isNull(value)) return null;
        super.add(item, value);
        this._save();
        return value;
    }

    remove(item: string) {
        if (Utils.isEmpty(item) || Utils.isEmpty(this.data)) return null;
        super.remove(item);
        this._save();
    }

    clear() {
        super.clear();
        delete this._storage[this._container];
    }

    static clear() {
        window.localStorage.clear();
        window.sessionStorage.clear();
    }

    private _save() {
        if (Utils.isEmpty(this.data)) return;
        this._storage[this._container] = JSON.stringify(this.data);
    }

    private _load() {
        super.clear();
        if (Utils.isEmpty(this._storage[this._container])) return;
        this.data = JSON.parse(this._storage[this._container]) as IDictionary<T>;
    }
}

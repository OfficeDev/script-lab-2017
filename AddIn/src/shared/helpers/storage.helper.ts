import {Dictionary, IDictionary} from './';

export enum StorageTypes {
    LocalStorage,
    SessionStorage
}

export class StorageHelper<T> extends Dictionary<T>{
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

    insert(item: string, value: T): T {
        super.add(item, value);
        this._save();
        return value;
    }

    remove(item: string): T {
        var deletedItem = super.remove(item);
        this._save();
        return deletedItem;
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
        this._storage[this._container] = JSON.stringify(this.items);
    }

    private _load() {
        super.clear();
        this.items = JSON.parse(this._storage[this._container]) as IDictionary<T>;
    }
}
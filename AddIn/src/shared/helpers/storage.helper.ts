import {Dictionary, IDictionary, Utilities} from '../helpers';

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

        this.load();
    }

    insert(item: string, value: T): T {
        super.insert(item, value);
        this.save();
        return value;
    }

    add(item: string, value: T): T {
        super.add(item, value);
        this.save();
        return value;
    }

    remove(item: string): T {
        var deletedItem = super.remove(item);
        this.save();
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

    save() {
        this._storage[this._container] = JSON.stringify(this.items);
    }

    load() {
        super.clear();
        var data = this._storage[this._container];
        if (Utilities.isEmpty(data)) return;
        this.items = JSON.parse(data) as IDictionary<T>;
    }
}
import {Utils} from './';

export interface IDictionary<T> {
    [index: string]: T
}

export interface IRepository<T> {
    all(): IDictionary<T>;
    get(item: string): T;
    add(item: string, value: T): T;
    remove(item: string): T;
    clear();
}

export class Repository<T> implements IRepository<T> {
    data: IDictionary<T> = {};

    constructor(seedData?: IDictionary<T>) {
        if (Utils.isEmpty(seedData)) this.data = {};
        this.data = seedData;
    }

    all(): IDictionary<T> {
        if (Utils.isEmpty(this.data)) return null;
        return this.data;
    }

    first(): T {
        if (Utils.isEmpty(this.data)) return null;
        return _.first(_.values(this.data));
    }

    get(item: string): T {
        if (Utils.isEmpty(this.data)) return null;
        return _.has(this.data, item) ? this.data[item] : null;
    }

    add(item: string, value: T): T {
        if (Utils.isEmpty(item) || Utils.isNull(value)) return null;
        this.data[item] = value;
        return this.data[item];
    }

    remove(item: string): T {
        if (Utils.isEmpty(this.data)) return null;
        let value = this.data[item];
        delete this.data[item];
        return value as T;
    }

    clear() {
        this.data = {};
    }
}

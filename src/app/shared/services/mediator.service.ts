import {Injectable, EventEmitter} from '@angular/core';
import {Subject, Observable} from 'rxjs/Rx';
import {Utils, Repository} from '../helpers';

export interface IChannel {
    name: string,
    source$: Observable<any>
}

export interface IEventChannel extends IChannel {
    event: EventEmitter<any>
}

export interface ISubjectChannel extends IChannel {
    dataSource: Subject<any>
}

@Injectable()
export class MediatorService extends Repository<IChannel> {
    constructor() {
        super();
        this.data = {};
    }

    createEventChannel<T>(name: string): IEventChannel {
        var current = this.get(name);
        if (!Utils.isNull(current)) return current as IEventChannel;

        var event = new EventEmitter<T>();
        return this.add(name, { name: name, source$: event.asObservable(), event: event } as IChannel) as IEventChannel;
    }

    createSubjectChannel<T>(name: string): ISubjectChannel {
        var current = this.get(name);
        if (!Utils.isNull(current)) return current as ISubjectChannel;

        var dataSource = new Subject<T>();
        var event = dataSource.asObservable();
        return this.add(name, { name: name, source$: event, dataSource: dataSource } as IChannel) as ISubjectChannel;
    }
}
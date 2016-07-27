import {Injectable, EventEmitter} from '@angular/core';
import {Subject, Observable} from 'rxjs/Rx';
import {Utilities, Dictionary} from '../helpers';

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
export class MediatorService extends Dictionary<IChannel> {
    constructor() {
        super();
    }

    createEventChannel<T>(name: string): IEventChannel {
        var current = this.get(name);
        if (!Utilities.isNull(current)) return current as IEventChannel;

        var event = new EventEmitter<T>();
        return this.add(name, { name: name, source$: event.asObservable(), event: event } as IChannel) as IEventChannel;
    }

    createSubjectChannel<T>(name: string): ISubjectChannel {
        var current = this.get(name);
        if (!Utilities.isNull(current)) return current as ISubjectChannel;

        var dataSource = new Subject<T>();
        var event = dataSource.asObservable();
        return this.add(name, { name: name, source$: event, dataSource: dataSource } as IChannel) as ISubjectChannel;
    }
}
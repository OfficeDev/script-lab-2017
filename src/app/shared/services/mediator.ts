import { Injectable, EventEmitter } from '@angular/core';
import { Subject, Observable } from 'rxjs/Rx';
import { Dictionary } from '@microsoft/office-js-helpers';
import { Utilities } from '../helpers';

export interface Channel<T> {
    name: string,
    source$: Observable<T>
}

export interface EventChannel<T> extends Channel<T> {
    event: EventEmitter<T>
}

export interface SubjectChannel<T> extends Channel<T> {
    dataSource: Subject<T>
}

@Injectable()
export class Mediator extends Dictionary<Channel<any>> {
    constructor() {
        super();
    }

    createEventChannel<T>(name: string): EventChannel<T> {
        let current = this.get(name);
        if (!(current == null)) {
            return current as EventChannel<T>;
        }

        let event = new EventEmitter<T>();
        return this.add(name, { name: name, source$: event.asObservable(), event: event } as Channel<T>) as EventChannel<T>;
    }

    createSubjectChannel<T>(name: string): SubjectChannel<T> {
        let current = this.get(name);
        if (!(current == null)) {
            return current as SubjectChannel<T>;
        }

        let dataSource = new Subject<T>();
        let event = dataSource.asObservable();
        return this.add(name, { name: name, source$: event, dataSource: dataSource } as Channel<T>) as SubjectChannel<T>;
    }
}

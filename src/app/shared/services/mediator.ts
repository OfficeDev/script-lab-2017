import { Injectable, EventEmitter } from '@angular/core';
import { Subject, Observable } from 'rxjs/Rx';
import { Dictionary } from '@microsoft/office-js-helpers';
import { Utilities } from '../helpers';

export interface Channel {
    name: string,
    source$: Observable<any>
}

export interface EventChannel extends Channel {
    event: EventEmitter<any>
}

export interface SubjectChannel extends Channel {
    dataSource: Subject<any>
}

@Injectable()
export class Mediator extends Dictionary<Channel> {
    constructor() {
        super();
    }

    createEventChannel<T>(name: string): EventChannel {
        let current = this.get(name);
        if (!Utilities.isNull(current)) {
            return current as EventChannel;
        }

        let event = new EventEmitter<T>();
        return this.add(name, { name: name, source$: event.asObservable(), event: event } as Channel) as EventChannel;
    }

    createSubjectChannel<T>(name: string): SubjectChannel {
        let current = this.get(name);
        if (!Utilities.isNull(current)) {
            return current as SubjectChannel;
        }

        let dataSource = new Subject<T>();
        let event = dataSource.asObservable();
        return this.add(name, { name: name, source$: event, dataSource: dataSource } as Channel) as SubjectChannel;
    }
}

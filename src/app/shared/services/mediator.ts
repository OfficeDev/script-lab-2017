import { Injectable, EventEmitter, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs/Observable';

interface MediatorEvent<T> {
    name: string,
    data: T
}

@Injectable()
export class Mediator {
    private _channel: EventEmitter<MediatorEvent<any>> = new EventEmitter<MediatorEvent<any>>();

    emit<T>(event: string, data: T) {
        this._channel.emit(<MediatorEvent<T>>{
            name: event,
            data: data
        });
    }

    on<T>(type: string): Observable<T> {
        return this._channel
            .filter(value => value.name === type)
            .map(value => value.data as T);
    }
}

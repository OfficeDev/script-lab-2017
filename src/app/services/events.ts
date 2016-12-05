import { EventEmitter, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs';

export class Events {
    private _channel: EventEmitter<IEvent<any>> = new EventEmitter<IEvent<any>>();
    emit = (type: string, action: number, data: any) =>
        this._channel.emit({
            type: type,
            action: action,
            data: data
        });

    on<T>(type: number | string): Observable<IEvent<T>> {
        return this._channel.filter(event => event.type === type);
    }
}

export enum GalleryEvents {
    CREATE,
    DELETE,
    DELETE_ALL,
    IMPORT,
    SELECT,
    COPY
}

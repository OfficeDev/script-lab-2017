import { Injectable, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import * as _ from 'lodash';

interface NotificationEvent<T> {
    name: string,
    data: T
}

@Injectable()
export class Notification {
    private _error: string[] = [];
    private _info: string[] = [];
    private _channel: EventEmitter<NotificationEvent<any>> = new EventEmitter<NotificationEvent<any>>();

    showDialog(message: string, title: string, ...actions: string[]): Promise<string> {
        return new Promise(resolve => {
            let dialogActions = {};

            actions.forEach(action => {
                dialogActions[action] = action => resolve(action);
            });

            return this.emit<IDialog>('DialogEvent', {
                title: title || 'Alert',
                message: message,
                actions: dialogActions
            });
        });
    }

    emit<T>(event: string, data: T) {
        this._channel.emit(<NotificationEvent<T>>{
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

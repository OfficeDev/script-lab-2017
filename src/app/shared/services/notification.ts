import { Injectable } from '@angular/core';
import { Mediator, EventChannel } from './mediator';
import { Dialog } from '../components';

@Injectable()
export class Notification {
    private _channel: EventChannel<IDialog>;

    constructor(mediator: Mediator) {
        this._channel = mediator.createEventChannel<IDialog>('ShowDialog');
    }

    alert(message: string, title?: string, primary?: string, secondary?: string): Promise<boolean> {
        return new Promise(resolve => {
            return this._channel.event.emit({
                title: title || 'Alert',
                message: message,
                actions: {
                    [primary || 'Ok']: action => resolve(true),
                    [secondary || 'Cancel']: action => resolve(false)
                },
            });
        });
    }

    confirm(message: string, title?: string, primary?: string, secondary?: string, tertiary?: string): Promise<string> {
        return new Promise(resolve => {
            return this._channel.event.emit({
                title: title || 'Alert',
                message: message,
                actions: {
                    [primary || 'Yes']: action => resolve(action),
                    [secondary || 'No']: action => resolve(action),
                    [tertiary || 'Cancel']: action => resolve(action)
                },
            });
        });
    }
}

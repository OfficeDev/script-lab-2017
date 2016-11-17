import { Directive, Input, Output, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Notification } from '../../services';
import { MonacoEditor } from './monaco-editor';
import { ViewBase } from '../base';
import './monaco-editor.scss';

@Directive({
    selector: 'tab'
})
export class Tab extends ViewBase {
    @Input() name: string;
    @Input() language: string;
    @Input() active: boolean;
    @Input() content: string;
    @Output() contentChange: EventEmitter<string> = new EventEmitter<string>();
    index: number;
    state: IMonacoEditorState;

    constructor(
        private _tabs: MonacoEditor,
        private _mediator: Notification
    ) {
        super();
    }

    ngOnInit() {
        this.state = {
            name: this.name,
            viewState: null,
            model: null,
        };

        this._tabs.add(this.name, this);
        this.index = this._tabs.count;

        let subscription = this._mediator.on<string>('TabChangedEvent').subscribe(name => {
            if (name !== this.name) {
                this.active = false;
            }
        });

        this.markDispose(subscription);
    }

    activate() {
        this.active = true;
        this._mediator.emit<string>('TabChangedEvent', this.name);
        return this;
    }
}

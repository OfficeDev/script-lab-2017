import { Directive, Input, Output, EventEmitter } from '@angular/core';
import { Mediator, EventChannel } from '../../services';
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
    tabChanged$: EventChannel<string>;

    state: IMonacoEditorState;

    constructor(
        private _tabs: MonacoEditor,
        private _mediator: Mediator
    ) {
        super();
        this.tabChanged$ = this._mediator.createEventChannel<string>('TabChanged');
    }

    ngOnInit() {
        this.state = {
            name: this.name,
            viewState: null,
            model: null,
        };

        this._tabs.add(this.name, this);

        let subscription = this.tabChanged$.source$.subscribe(name => {
            if (name !== this.name) {
                this.active = false;
            }
        });

        this.markDispose(subscription);
    }

    activate() {
        this.active = true;
        this.tabChanged$.event.next(this.name);
        return this;
    }
}

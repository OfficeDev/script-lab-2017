import { Directive, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { Mediator, EventChannel, Monaco } from '../../services';
import { MonacoEditorTabs } from './monaco-editor-tabs';

@Directive({
    selector: 'monaco-editor-tab'
})
export class MonacoEditorTab implements OnChanges {
    @Input() name: string;
    @Input() active: boolean;
    @Input() content: string;
    @Input() language: string;
    @Input() intellisense: string[];

    channel: EventChannel<IMonacoEditorState>;
    view: IMonacoEditorState;

    constructor(
        private _monaco: Monaco,
        private _tabs: MonacoEditorTabs,
        private _mediator: Mediator
    ) {
        this.channel = this._mediator.createEventChannel<IMonacoEditorState>('tab-updated');
    }

    ngOnInit() {
        this.view = {
            name: this.name,
            state: null,
            model: null,
        };

        this._tabs.add(this.name, this);
    }

    ngOnChanges(changes: SimpleChanges) {
        if (this.name === 'Libraries') {
            let libraries = changes['content'].currentValue as string;
            if (_.isEmpty(libraries)) {
                return;
            }

            this._monaco.updateLibs('typescript', libraries.split('\n'));
        }

        this.channel.event.next(this.view);
    }
}

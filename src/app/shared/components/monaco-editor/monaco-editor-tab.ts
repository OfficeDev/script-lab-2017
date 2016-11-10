import { Directive, Input, Output, EventEmitter } from '@angular/core';
import { MonacoEditorTabs } from './monaco-editor-tabs';

@Directive({
    selector: 'monaco-editor-tab'
})
export class MonacoEditorTab {
    @Input() name: string;
    @Input() language: string;

    @Input() active: boolean;
    @Output() activeChange: EventEmitter<string> = new EventEmitter<string>();

    @Input() content: string;
    @Output() contentChange: EventEmitter<string> = new EventEmitter<string>();

    state: IMonacoEditorState;

    constructor(private _tabs: MonacoEditorTabs) {
    }

    ngOnInit() {
        this.state = {
            name: this.name,
            viewState: null,
            model: null,
        };

        this._tabs.add(this.name, this);

        this.activeChange.subscribe(name => {
            if (name !== this.name) {
                this.active = false;
            }
        });
    }

    activate() {
        this.active = true;
        this.activeChange.next(this.name);
        return this;
    }
}

import { Directive, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Monaco, Intellisense, Notification, Disposable } from '../../services';
import { MonacoEditor } from './monaco-editor';
import './monaco-editor.scss';

@Directive({
    selector: 'tab'
})
export class Tab extends Disposable implements OnChanges, ITab {
    @Input() name: string;
    @Input() language: string;

    @Input() active: string;
    @Output() activeChange: EventEmitter<string> = new EventEmitter<string>();

    @Input() content: string;
    @Output() contentChange: EventEmitter<string> = new EventEmitter<string>();

    index: number;
    state: IMonacoEditorState;

    private _initialized: boolean;

    constructor(
        private _monacoEditor: MonacoEditor,
        private _intellisense: Intellisense
    ) {
        super();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['content']) {
            if (changes['content'].isFirstChange()) {
                this._monacoEditor.tabs.add(this.name, this);
                this.index = this._monacoEditor.tabs.count;
            }

            if (this.name === 'Libraries') {
                return this._intellisense.updateLibs('typescript', this.content.split('\n'));
            }
        }
    }

    get isActive(): boolean {
        return this.name === this.active;
    }

    async checkForRefresh(id: string) {
        let current = await Monaco.current;
        if (!this._initialized) {
            this.state = {
                id: null,
                name: this.name,
                viewState: null,
                model: null,
            };
        }

        if (this.state.id === id) {
            return;
        }

        if (this.state.model) {
            this.state.model.dispose();
        }

        this.state.id = id;
        this.state.model = monaco.editor.createModel(this.content, this.language);
        this.state.viewState = null;
        this._initialized = true;
    }

    activate() {
        this.active = this.name;
        this.activeChange.next(this.name);
        return this;
    }
}

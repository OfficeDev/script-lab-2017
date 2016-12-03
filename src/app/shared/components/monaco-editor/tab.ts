import { Directive, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { Monaco, Intellisense, Notification, Disposable } from '../../services';
import { MonacoEditor } from './monaco-editor';
import './monaco-editor.scss';

@Directive({
    selector: 'tab'
})
export class Tab extends Disposable implements OnInit, OnChanges, ITab {
    @Input() name: string;
    @Input() language: string;

    @Input() active: string;
    @Output() activeChange: EventEmitter<string> = new EventEmitter<string>();

    @Input() content: string;
    @Output() contentChange: EventEmitter<string> = new EventEmitter<string>();

    index: number;
    state: IMonacoEditorState = {
        snippetId: null,
        viewState: null,
        model: null,
    };

    private _initialized: boolean;
    private _susbcription: Subscription;

    constructor(
        private _monacoEditor: MonacoEditor,
        private _intellisense: Intellisense
    ) {
        super();
    }

    async ngOnChanges(changes: SimpleChanges) {
        if (changes['content']) {
            if (this.name === 'Libraries') {
                if (this._susbcription && !this._susbcription.closed) {
                    console.log('stopping intellisense load');
                    this._susbcription.unsubscribe();
                }

                this._susbcription = await this._intellisense.updateIntellisense(this.content.split('\n'));
            }
        }
    }

    ngOnInit() {
        this._monacoEditor.tabs.add(this.name, this);
        this.index = this._monacoEditor.tabs.count;
    }

    get isActive(): boolean {
        return this.name === this.active;
    }

    async updateTabState(id: string) {
        let monaco = await Monaco.current;
        if (this.state.snippetId === id) {
            return;
        }

        if (this.state.model) {
            this.state.model.dispose();
        }

        this.state.snippetId = id;
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

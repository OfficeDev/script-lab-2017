import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { Disposable, Monaco, Events, GalleryEvents } from '../shared/services';
import { sample } from './sample';

@Component({
    selector: 'import-view',
    templateUrl: 'import.view.html',
})
export class ImportView extends Disposable implements OnInit, OnDestroy {
    private _monacoEditor: monaco.editor.IStandaloneCodeEditor;
    @ViewChild('editor') private _editor: ElementRef;

    private _open: boolean = false;
    @Output() openChange = new EventEmitter<boolean>();
    @Input() get open() {
        return this._open;
    }

    set open(value) {
        this._open = value;
        this.openChange.emit(value);
        if (value === false && this._monacoEditor) {
            this._monacoEditor.setModel(this._model);
            this._resize();
        }
    }

    private _model = monaco.editor.createModel(sample, 'yaml');

    constructor(
        private _monaco: Monaco,
        private _events: Events
    ) {
        super();
    }

    async ngOnInit() {
        this._monacoEditor = await this._monaco.create(this._editor, { lineNumbers: false });
        this._monacoEditor.setModel(this._model);
        this._monacoEditor.restoreViewState(null);
        this._monacoEditor.layout();
        this._monacoEditor.focus();
    }

    ngOnDestroy() {
        if (this._monacoEditor) {
            this._monacoEditor.dispose();
        }
    }

    @HostListener('window:resize', ['$event'])
    private _resize() {
        if (this._monacoEditor) {
            this._monacoEditor.layout();
            this._monacoEditor.setScrollTop(0);
            this._monacoEditor.setScrollLeft(0);
        }
    }

    import() {
        let inputValue = this._monacoEditor.getValue();
        if (inputValue === sample) {
            return;
        }

        this._events.emit('GalleryEvents', GalleryEvents.IMPORT, inputValue);
        this.open = false;
    }

    cancel() {
        this.open = false;
    }
}

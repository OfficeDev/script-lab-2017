import {Component, Input, OnInit, ViewChild, ElementRef} from '@angular/core';
import {Tabs} from './tab-container.component';
import {Utilities} from '../../helpers';

declare const require: any;

@Component({
    selector: 'tab',
    template: '<section #editor class="monaco-editor"></section>',
    styleUrls: ['tab.component.scss'],
})
export class Tab {
    @Input() name: string;
    @Input() active: boolean;
    @Input() content: string;
    @Input() launguage: string;
    @ViewChild('editor') private _editor: ElementRef;

    private _monacoEditor: monaco.editor.IStandaloneCodeEditor;

    constructor(
        private element: ElementRef,
        private tabs: Tabs
    ) {
    }

    ngOnInit() {
        (<any>window).require(['vs/editor/editor.main'], () => {
            this._monacoEditor = monaco.editor.create(this._editor.nativeElement, {
                value: this.content || '',
                language: this.launguage || 'typescript',
                lineNumbers: true,
                roundedSelection: false,
                scrollBeyondLastLine: false,
                readOnly: false
            });
        });

        this.tabs.add(this.name, this);
    }

    activate() {
        $(this.element.nativeElement).css('display', 'block');        
        this.active = true;
        if (!Utilities.isNull(this._monacoEditor)) {
            this._monacoEditor.layout();
            this._monacoEditor.setScrollTop(0);
            this._monacoEditor.setScrollLeft(0);
            this._monacoEditor.focus();
        }
    }

    deactivate() {
        $(this.element.nativeElement).css('display', 'none');
        this.active = false;
    }
}
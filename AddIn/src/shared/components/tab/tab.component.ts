import {Component, Input, Output, OnInit, OnDestroy, OnChanges, ViewChild, ElementRef, SimpleChanges, EventEmitter} from '@angular/core';
import {Tabs} from './tab-container.component';
import {Utilities} from '../../helpers';

declare const require: any;

@Component({
    selector: 'tab',
    template: '<section #editor class="monaco-editor" (keyup)="syncContent()"></section>',
    styleUrls: ['tab.component.scss'],
})
export class Tab implements OnInit, OnChanges, OnDestroy {
    @Input() name: string;
    @Input() active: boolean;
    @Input() content: string;
    @Input() language: string;
    @Input() readonly: boolean;
    @Output() change: EventEmitter<string> = new EventEmitter<string>();
    @ViewChild('editor') private _component: ElementRef;

    syncContent: () => void;
    private _monacoEditor: monaco.editor.IStandaloneCodeEditor;

    constructor(
        private element: ElementRef,
        private tabs: Tabs
    ) {
        this.syncContent = _.debounce(() => {
            if (Utilities.isNull(this._monacoEditor)) return;
            this.change.next(this._monacoEditor.getValue());
        }, 400);
    }

    ngOnInit() {
        var content = (!_.isString(this.content) || _.isEmpty(this.content)) ? '' : this.content;
        (<any>window).require(['vs/editor/editor.main'], () => {
            this._monacoEditor = monaco.editor.create(this._component.nativeElement, {
                value: content,
                language: this.language,
                lineNumbers: true,
                roundedSelection: false,
                scrollBeyondLastLine: false,
                wrappingColumn: 0,
                readOnly: this.readonly
            });
        });

        $(window).resize(() => {
            this.resize();
        });

        this.tabs.add(this.name, this);
    }

    ngOnChanges(changes: SimpleChanges) {
        var data = (<any>changes).content;
        if (!Utilities.isNull(this._monacoEditor)) {
            if (changes['content'].currentValue !== this.content)
                this._monacoEditor.setValue(changes['content'].currentValue);
        }
    }

    ngOnDestroy() {
        $(window).unbind('resize');
    }

    activate() {
        $(this.element.nativeElement).css('display', 'block');
        this.active = true;
        if (!Utilities.isNull(this._monacoEditor)) {
            this.resize();
            this._monacoEditor.focus();
        }
    }

    resize() {
        this._monacoEditor.layout();
        this._monacoEditor.setScrollTop(0);
        this._monacoEditor.setScrollLeft(0);
    }

    deactivate() {
        $(this.element.nativeElement).css('display', 'none');
        this.active = false;
    }
}
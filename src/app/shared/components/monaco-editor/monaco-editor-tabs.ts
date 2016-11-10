import { Component, HostListener, Input, Output, EventEmitter, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Dictionary } from '@microsoft/office-js-helpers';
import { Monaco, Snippet } from '../../services';
import { MonacoEditorTab } from './monaco-editor-tab';
import * as _ from 'lodash';

@Component({
    selector: 'monaco-editor-tabs',
    template: `
    <ul class="tabs ms-Pivot ms-Pivot--tabs">
        <li class="tabs__tab ms-Pivot-link" *ngFor="let tab of values()" (click)="select(tab)" [ngClass]="{'is-selected tabs__tab--active': tab.active}">
            {{tab.alias||tab.name}}
        </li>
    </ul>
    <div class="tabs__container">
        <section #editor class="monaco-editor" (keydown)="edit($event)"></section>
    </div>`,
    styleUrls: ['monaco-editor.component.scss']
})
export class MonacoEditorTabs extends Dictionary<MonacoEditorTab> implements AfterViewInit {
    private _monacoEditor: monaco.editor.IStandaloneCodeEditor;
    private _debouncedInput = _.debounce((event: KeyboardEvent) => this.currentTab.contentChange.next(this._monacoEditor.getValue()), 250);

    currentTab: MonacoEditorTab;
    @ViewChild('editor') private _editor: ElementRef;
    @Input() readonly: boolean;
    @Output() save: EventEmitter<void> = new EventEmitter<void>();

    constructor(private _monaco: Monaco) {
        super();
    }

    ngAfterViewInit() {
        this._monaco.create(this._editor).then(monacoEditor => {
            this._monacoEditor = monacoEditor;
            this.select(this.get('Script'));
        });
    }

    edit(event: KeyboardEvent) {
        this._debouncedInput(event);
        if (event.ctrlKey || event.metaKey) {
            switch (String.fromCharCode(event.which).toLowerCase()) {
                case 's':
                    this.save.next();
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    break;
            }
        }
    }

    select(tab: MonacoEditorTab) {
        if (!(this.currentTab == null)) {
            this.currentTab.state = {
                name: this.currentTab.name,
                content: this._monacoEditor.getValue(),
                model: this._monacoEditor.getModel(),
                viewState: this._monacoEditor.saveViewState()
            };
        }

        this.currentTab = tab.activate();

        if (this.currentTab.state.model == null) {
            // If this is the first time we are switching to this tab
            // then create a new model and save that.
            let newModel = monaco.editor.createModel(this.currentTab.content, this.currentTab.language);
            this.currentTab.state.model = newModel;
        }

        this._monacoEditor.setModel(this.currentTab.state.model);
        this._monacoEditor.restoreViewState(this.currentTab.state.viewState);
        this.currentTab = tab.activate();
        this._monacoEditor.focus();
    }

    @HostListener('window:resize', ['$event'])
    resize() {
        if (this._monacoEditor) {
            this._monacoEditor.layout();
            this._monacoEditor.setScrollTop(0);
            this._monacoEditor.setScrollLeft(0);
        }
    }
}

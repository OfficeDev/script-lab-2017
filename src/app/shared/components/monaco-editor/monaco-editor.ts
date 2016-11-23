import { Component, HostListener, Input, Output, OnChanges, OnDestroy, SimpleChanges, EventEmitter, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Observable } from 'rxjs';
import { Dictionary } from '@microsoft/office-js-helpers';
import { Monaco, MonacoEvents, Snippet, Notification, Disposable } from '../../services';
import { Tab } from './tab';
import * as _ from 'lodash';
import './monaco-editor.scss';

@Component({
    selector: 'monaco-editor',
    template: `
    <ul class="tabs ms-Pivot ms-Pivot--tabs">
        <li class="tabs__tab ms-Pivot-link" *ngFor="let tab of tabs.values()" (click)="updateView(tab)" [ngClass]="{'is-selected tabs__tab--active': tab.isActive}">
            {{tab.name}}
        </li>
    </ul>
    <div class="tabs__container">
        <section #editor class="monaco-editor" (keydown)="bindToEdit()"></section>
    </div>`,
    styleUrls: []
})
export class MonacoEditor extends Disposable implements AfterViewInit, OnChanges {
    private _monacoEditor: monaco.editor.IStandaloneCodeEditor;
    private _debouncedInput = _.debounce((event: monaco.IKeyboardEvent) => {
        let value = this._monacoEditor.getValue();
        this._activeTab.contentChange.emit(value);
    }, 300);

    private _activeTab: Tab;
    public tabs: Dictionary<Tab>;

    @ViewChild('editor') private _editor: ElementRef;
    @Input() id: string;
    @Input() readonly: boolean;
    @Output() events: EventEmitter<MonacoEvents> = new EventEmitter<MonacoEvents>();

    @Input() activeLanguage: string;
    @Output() activeLanguageChange: EventEmitter<string> = new EventEmitter<string>();

    @Input() theme: string;
    @Output() themeChange: EventEmitter<string> = new EventEmitter<string>();

    constructor(
        private _monaco: Monaco,
        private _notification: Notification
    ) {
        super();
        this.tabs = new Dictionary<Tab>();
    }

    ngAfterViewInit() {
        this._monaco.create(this._editor, {
            theme: this.theme || 'vs',
        })
            .then(editor => this._monacoEditor = editor)
            .then(() => this.updateView(this.tabs.get('Script'), true))
            .then(() => this._monacoEditor.onKeyDown(e => this.bindToEdit(e)));
    }

    ngOnChanges(changes: SimpleChanges) {
        if (this._activeTab) {
            if (!_.isEmpty(changes['theme'])) {
                this._monaco.updateOptions(this._monacoEditor, {
                    theme: changes['theme'].currentValue
                });
            }
            if (!_.isEmpty(changes['id'])) {
                this.updateView(this._activeTab);
            }
        }
    }

    updateView(tab: Tab, skipSave?: boolean) {
        let saveCurrentTabState = !(this._activeTab == null);
        if (!skipSave && saveCurrentTabState) {
            this._activeTab.state.model = this._monacoEditor.getModel();
            this._activeTab.state.viewState = this._monacoEditor.saveViewState();
        };

        this._activeTab = tab.activate();
        return this._activeTab.checkForRefresh(this.id).then(() => {
            this._monacoEditor.setModel(this._activeTab.state.model);
            this._monacoEditor.restoreViewState(this._activeTab.state.viewState);
            this._monacoEditor.focus();
            this.activeLanguageChange.emit(this._activeTab.language);
        });
    }

    bindToEdit(event: monaco.IKeyboardEvent) {
        if (event == null) {
            return;
        }

        this._debouncedInput(event);
        if (event.ctrlKey || event.metaKey) {
            let monacoEvent: MonacoEvents;
            switch (event.keyCode) {
                case monaco.KeyCode.KEY_S:
                    monacoEvent = MonacoEvents.SAVE;
                    break;

                case monaco.KeyCode.KEY_B:
                    monacoEvent = MonacoEvents.TOGGLE_MENU;
                    break;

                case monaco.KeyCode.F5:
                    monacoEvent = MonacoEvents.RUN;
                    break;

                case monaco.KeyCode.US_OPEN_SQUARE_BRACKET: {
                    let index = this._activeTab.index;
                    let key;
                    if (index === this.tabs.count) {
                        key = this.tabs.keys()[0];
                    }
                    else {
                        key = this.tabs.keys()[index];
                    }
                    this.updateView(this.tabs.get(key));
                    monacoEvent = -1;
                    break;
                }

                case monaco.KeyCode.US_CLOSE_SQUARE_BRACKET: {
                    let index = this._activeTab.index;
                    let key;
                    if (index === 1) {
                        key = this.tabs.keys()[this.tabs.count - 1];
                    }
                    else {
                        key = this.tabs.keys()[index - 2];
                    }
                    this.updateView(this.tabs.get(key));
                    monacoEvent = -1;
                    break;
                }
            }

            if (!(monacoEvent == null)) {
                this.events.emit(monacoEvent);
                event.preventDefault();
                event.stopPropagation();
            }
        }
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

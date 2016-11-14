import { Component, HostListener, Input, Output, OnChanges, SimpleChanges, EventEmitter, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Dictionary } from '@microsoft/office-js-helpers';
import { Monaco, MonacoEvents, Snippet } from '../../services';
import { Tab } from './tab';
import * as _ from 'lodash';
import './monaco-editor.scss';

@Component({
    selector: 'monaco-editor',
    template: `
    <ul class="tabs ms-Pivot ms-Pivot--tabs">
        <li class="tabs__tab ms-Pivot-link" *ngFor="let tab of values()" (click)="select(tab)" [ngClass]="{'is-selected tabs__tab--active': tab.active}">
            {{tab.alias||tab.name}}
        </li>
    </ul>
    <div class="tabs__container">
        <section #editor class="monaco-editor"></section>
    </div>`,
    styleUrls: []
})
export class MonacoEditor extends Dictionary<Tab> implements AfterViewInit {
    private _monacoEditor: monaco.editor.IStandaloneCodeEditor;
    private _debouncedInput = _.debounce((event: monaco.IKeyboardEvent) => this.currentTab.contentChange.next(this._monacoEditor.getValue()), 200);

    currentTab: Tab;
    @ViewChild('editor') private _editor: ElementRef;
    @Input() readonly: boolean;
    @Output() events: EventEmitter<MonacoEvents> = new EventEmitter<MonacoEvents>();
    @Input() lang: string;
    @Output() langChange: EventEmitter<string> = new EventEmitter<string>();
    @Input() theme: string;
    @Output() themeChange: EventEmitter<string> = new EventEmitter<string>();

    constructor(private _monaco: Monaco) {
        super();
    }

    ngAfterViewInit() {
        this._monaco.create(this._editor).then(monacoEditor => {
            this._monacoEditor = monacoEditor;
            monacoEditor.onKeyDown(event => this.edit(event));
            this.select(this.get('Script'));
        });
    }

    ngOnChanges(changes: SimpleChanges) {
        if (this.currentTab) {
            if (!_.isEmpty(changes['lang'])) {
                this.currentTab.language = changes['lang'].currentValue;
            }
            else if (!_.isEmpty(changes['theme'])) {
                this._monaco.updateOptions(this._monacoEditor, {
                    theme: changes['theme'].currentValue
                });
            }
        }
    }

    edit(event: monaco.IKeyboardEvent) {
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
                    let index = this.currentTab.index;
                    let key;
                    if (index === this.count) {
                        key = this.keys()[0];
                    }
                    else {
                        key = this.keys()[index];
                    }
                    this.select(this.get(key));
                    monacoEvent = -1;
                    break;
                }

                case monaco.KeyCode.US_CLOSE_SQUARE_BRACKET: {
                    let index = this.currentTab.index;
                    let key;
                    if (index === 1) {
                        key = this.keys()[this.count - 1];
                    }
                    else {
                        key = this.keys()[index - 2];
                    }
                    this.select(this.get(key));
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

    select(tab: Tab) {
        // If the current tab is not null
        // then save its current state.
        if (!(this.currentTab == null)) {
            this.currentTab.state = {
                name: this.currentTab.name,
                content: this._monacoEditor.getValue(),
                model: this._monacoEditor.getModel(),
                viewState: this._monacoEditor.saveViewState()
            };
        }

        this.currentTab = tab.activate();

        // If this is the first time we are switching to this tab
        // then create a new model and save that.
        if (this.currentTab.state.model == null) {
            let newModel = monaco.editor.createModel(this.currentTab.content, this.currentTab.language);
            this.currentTab.state.model = newModel;
        }

        // Update the editor state to reflect the new tab's data.
        this._monacoEditor.setModel(this.currentTab.state.model);
        this._monacoEditor.restoreViewState(this.currentTab.state.viewState);
        this.currentTab = tab.activate();
        this._monacoEditor.focus();
        this.langChange.emit(this.currentTab.language);
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

import { Component, Input, OnChanges, SimpleChanges, HostListener, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Observable } from 'rxjs';
import { Storage, StorageType } from '@microsoft/office-js-helpers';
import * as fromRoot from '../../reducers';
import { Store } from '@ngrx/store';
import { MonacoService, Disposable } from '../../services';
import * as _ from 'lodash';
import './monaco-editor.scss';

@Component({
    selector: 'monaco-editor',
    template: `
        <ul class="tabs ms-Pivot ms-Pivot--tabs">
            <li class="tabs__tab ms-Pivot-link" *ngFor="let tab of tabs.values()" (click)="changeTab(tab)" [ngClass]="{'is-selected tabs__tab--active': tab.name === activeTab?.name}">
                {{tab.view}}
            </li>
        </ul>
        <section [hidden]="!snippet" id="editor" #editor class="viewport"></section>
        <section [hidden]="snippet" class="viewport__placeholder"></section>
    `
})
export class MonacoEditor extends Disposable implements OnChanges, AfterViewInit, OnDestroy {
    private _monacoEditor: monaco.editor.IStandaloneCodeEditor;

    @Input() snippet: ISnippet;
    @ViewChild('editor') private _editor: ElementRef;
    tabs = new Storage<IMonacoEditorState>('MonacoState', StorageType.SessionStorage);
    activeTab: IMonacoEditorState;

    constructor(
        private _store: Store<fromRoot.State>,
        private _monaco: MonacoService,
    ) {
        super();
        this._initialize();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['snippet'] && changes['snippet'].currentValue) {
            this._update();
        }
    }

    async ngAfterViewInit() {
        this.activeTab = this.tabs.get('script');
        this._monacoEditor = await this._monaco.create(this._editor, {
            theme: 'vs',
            value: this.activeTab.content,
            language: this.activeTab.language
        });

        let subscription =
            this._store.select(fromRoot.getTheme)
                .subscribe(isLight =>
                    this._monacoEditor.updateOptions({
                        theme: isLight ? 'vs' : 'vs-dark'
                    }));

        this.markDispose(subscription);
    }

    changeTab(tab: IMonacoEditorState) {
        if (this.snippet) {
            if (!(this.activeTab == null)) {
                this.activeTab.content = this._monacoEditor.getValue();
                this.activeTab.model = this._monacoEditor.getModel();
                this.activeTab.viewState = this._monacoEditor.saveViewState();
            };
        }

        this.activeTab = tab;
        if (this.snippet) {
            this._monacoEditor.setModel(this.activeTab.model);
            this._monacoEditor.restoreViewState(this.activeTab.viewState);
            this._monacoEditor.focus();
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

    private async _initialize() {
        ['Script', 'Template', 'Style', 'Libraries'].forEach(title => {
            let name = title.toLowerCase();

            let tab = <IMonacoEditorState>{
                name: name,
                view: title,
                viewState: null
            };

            this.tabs.insert(name, tab);
        });
    }

    private async _update() {
        this.tabs.values().forEach(item => {
            if (item.model) {
                item.model.dispose();
            }

            if (item.name === 'libraries') {
                item.content = this.snippet[item.name];
                item.language = item.name;
                item.model = monaco.editor.createModel(this.snippet[item.name], item.name);
                item.viewState = null;
            }
            else {
                item.content = this.snippet[item.name].content;
                item.language = this.snippet[item.name].language;
                item.model = monaco.editor.createModel(this.snippet[item.name].content, this.snippet[item.name].language);
                item.viewState = null;
            }
        });

        this.activeTab = this.tabs.get('script');
    }
}


// private _onKeyDown(event: monaco.IKeyboardEvent) {
    //     if (event == null) {
    //         return;
    //     }

    //     if (event.ctrlKey || event.metaKey) {
    //         let monacoEvent: MonacoEvents;
    //         switch (event.keyCode) {
    //             case monaco.KeyCode.KEY_S:
    //                 monacoEvent = MonacoEvents.SAVE;
    //                 break;

    //             case monaco.KeyCode.KEY_B:
    //                 monacoEvent = MonacoEvents.TOGGLE_MENU;
    //                 break;

    //             case monaco.KeyCode.F5:
    //                 monacoEvent = MonacoEvents.RUN;
    //                 break;

    //             case monaco.KeyCode.US_OPEN_SQUARE_BRACKET: {
    //                 let index = this._activeTab.index;
    //                 let key;
    //                 if (index === this.tabs.count) {
    //                     key = this.tabs.keys()[0];
    //                 }
    //                 else {
    //                     key = this.tabs.keys()[index];
    //                 }
    //                 this.changeTab(this.tabs.get(key));
    //                 monacoEvent = -1;
    //                 break;
    //             }

    //             case monaco.KeyCode.US_CLOSE_SQUARE_BRACKET: {
    //                 let index = this._activeTab.index;
    //                 let key;
    //                 if (index === 1) {
    //                     key = this.tabs.keys()[this.tabs.count - 1];
    //                 }
    //                 else {
    //                     key = this.tabs.keys()[index - 2];
    //                 }
    //                 this.changeTab(this.tabs.get(key));
    //                 monacoEvent = -1;
    //                 break;
    //             }
    //         }

    //         if (!(monacoEvent == null)) {
    //             this.events.emit(monacoEvent);
    //             event.preventDefault();
    //             event.stopPropagation();
    //         }
    //     }
    // }
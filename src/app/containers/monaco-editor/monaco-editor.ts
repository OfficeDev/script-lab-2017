import { Component, Input, HostListener, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Observable } from 'rxjs';
import { Storage, StorageType } from '@microsoft/office-js-helpers';
import * as fromRoot from '../../reducers';
import { Store } from '@ngrx/store';
import { ChangeTabAction } from '../../actions/monaco';
import { MonacoService, Disposable } from '../../services';
import * as _ from 'lodash';
import './monaco-editor.scss';

@Component({
    selector: 'monaco-editor',
    template: `
        <ul class="tabs ms-Pivot ms-Pivot--tabs" [hidden]="hide">
            <li class="tabs__tab ms-Pivot-link" *ngFor="let tab of tabs.values()" (click)="changeTab(tab.name)" [ngClass]="{'is-selected tabs__tab--active' : tab.name === (activeTab$|async)}">
                {{tab.view}}
            </li>
        </ul>
        <section [hidden]="hide" id="editor" #editor class="viewport"></section>
        <section [hidden]="!hide" class="viewport__placeholder"></section>
    `
})
export class MonacoEditor extends Disposable implements AfterViewInit {
    private _monacoEditor: monaco.editor.IStandaloneCodeEditor;
    @ViewChild('editor') private _editor: ElementRef;
    tabs = new Storage<IMonacoEditorState>('MonacoState', StorageType.SessionStorage);
    currentState: IMonacoEditorState;
    hide: boolean = true;

    source$: string;
    readonly$: Observable<boolean>;

    constructor(
        private _store: Store<fromRoot.State>,
        private _monaco: MonacoService,
    ) {
        super();
        this.readonly$ = this._store.select(fromRoot.getReadOnly);
    }

    /**
     * Initialize the component and subscribe to all the neccessary actions.
     */
    async ngAfterViewInit() {
        this._monacoEditor = await this._monaco.create(this._editor, { theme: 'vs', });

        ['Script', 'Template', 'Style', 'Libraries'].forEach(title => {
            let name = title.toLowerCase();

            let tab = <IMonacoEditorState>{
                name: name,
                view: title,
                viewState: null
            };

            this.tabs.insert(name, tab);
        });

        this._store.select(fromRoot.getCurrent)
            .filter(data => {
                this.hide = data == null;
                return !this.hide;
            })
            .subscribe(snippet => this._changeSnippet(snippet));

        this._store.select(fromRoot.getActiveTab)
            .filter(data => !(data == null))
            .subscribe(tab => {
                // If there's a current state, then save it
                if (!(this.currentState == null)) {
                    this.currentState.content = this._monacoEditor.getValue();
                    this.currentState.model = this._monacoEditor.getModel();
                    this.currentState.viewState = this._monacoEditor.saveViewState();
                    this.tabs.insert(this.currentState.name, this.currentState);
                }

                // Update the current state to the new tab
                this.currentState = this.tabs.get(tab);
                this._monacoEditor.setModel(this.currentState.model);
                this._monacoEditor.restoreViewState(this.currentState.viewState);
                this._monacoEditor.focus();
                this._monacoEditor.layout();
            });
    }

    changeTab = (name: string = 'script') => this._store.dispatch(new ChangeTabAction(name));

    /**
     * Triggered when the snippet is changed and a new snippet is loaded
     */
    private async _changeSnippet(snippet) {
        this.tabs.values().forEach(item => {
            if (item.model) {
                item.model.dispose();
            }

            let content, language, model, viewState = null;

            if (item.name === 'libraries') {
                [content, language] = [snippet[item.name], item.name];
            }
            else {
                content = snippet[item.name].content;
                language = snippet[item.name].language;
            }
            model = monaco.editor.createModel(content, language);

            item.model = model;
            item.content = content;
            item.language = language;
            item.viewState = viewState;
        });

        this.changeTab();
    }

    /**
     * Resize the Monaco Editor when ever there's a change in the
     * resolution. Also invoked when the menu is dismissed.
     */
    @HostListener('window:resize', ['$event'])
    private _resize() {
        if (this._monacoEditor) {
            this._monacoEditor.layout();
            this._monacoEditor.setScrollTop(0);
            this._monacoEditor.setScrollLeft(0);
        }
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
import { Component, Input, HostListener, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Dictionary } from '@microsoft/office-js-helpers';
import * as fromRoot from '../reducers';
import { Store } from '@ngrx/store';
import { AI } from '../helpers';
import { Strings } from '../strings';
import { Monaco, Snippet } from '../actions';
import { MonacoService } from '../services';
import { debounce } from 'lodash';

@Component({
    selector: 'editor',
    template: `
        <ul class="tabs ms-Pivot ms-Pivot--tabs" [hidden]="hide">
            <li class="tabs__tab ms-Pivot-link" *ngFor="let tab of tabs.values()" (click)="changeTab(tab.name)" [ngClass]="{'is-selected tabs__tab--active' : tab.name === currentState?.name}">
                {{tab.displayName}}
            </li>
        </ul>
        <section id="editor" #editor class="viewport"></section>
        <section [hidden]="!hide" class="viewport__placeholder"></section>
    `
})
export class Editor implements AfterViewInit {
    @ViewChild('editor') private _editor: ElementRef;
    @Input() isViewMode: boolean;
    private _monacoEditor: monaco.editor.IStandaloneCodeEditor;

    tabs = new Dictionary<IMonacoEditorState>();
    currentState: IMonacoEditorState;
    hide: boolean = true;

    constructor(
        private _store: Store<fromRoot.State>,
        private _monaco: MonacoService
    ) {
    }

    /**
     * Initialize the component and subscribe to all the necessary actions.
     */
    async ngAfterViewInit() {
        let _overrides = { theme: 'vs' };
        if (this.isViewMode) {
            _overrides['readOnly'] = true;
        }
        this._monacoEditor = await this._monaco.create(this._editor, _overrides);
        let editor = this._monacoEditor;
        editor.addAction({
            id: 'trigger-suggest', /* Unique id for action */
            label: Strings().editorTriggerSuggestContextMenuLabel,
            keybindings: [monaco.KeyCode.F2],
            keybindingContext: null,
            contextMenuGroupId: 'navigation',
            contextMenuOrder: 0, /* put at top of context menu */
            run: () => editor.trigger('ngAfterViewInit', 'editor.action.triggerSuggest', {})
        });
        this._createTabs();
        this._subscribeToState();
    }

    changeTab = (name: string = 'script') => {
        let language = '';
        if (name !== 'libraries') {
            language = this.tabs.get(name).language;
        }

        this._store.dispatch(new Monaco.ChangeTabAction({ name: name, language }));
    }

    updateIntellisense() {
        if (this.snippet == null) {
            return;
        }

        this._store.dispatch(new Monaco.UpdateIntellisenseAction(
            { libraries: this.snippet.libraries.split('\n'), language: 'typescript' }
        ));
    }

    private _createTabs() {
        ['script', 'template', 'style', 'libraries'].forEach(name => {
            const displayName = Strings().tabDisplayNames[name];
            if (!displayName) {
                throw new Error(`No display name for tab "${name}"`);
            }

            let tab = <IMonacoEditorState>{
                name,
                displayName,
                viewState: null
            };

            this.tabs.insert(name, tab);
        });
    }

    private _subscribeToState() {
        this._store.select(fromRoot.getMenu)
            .subscribe(() => this._resize());

        this._store.select(fromRoot.getTheme)
            .subscribe(theme => monaco.editor.setTheme(theme ? 'vs' : 'vs-dark'));

        this._store.select(fromRoot.getCurrent)
            .filter(data => {
                this.hide = data == null;
                return !this.hide;
            })
            .subscribe(snippet => {
                this._store.dispatch(new Monaco.ResetAction());
                this._changeSnippet(snippet);
            });

        this._store.select(fromRoot.getActiveTab)
            .subscribe(newTab => {
                if (newTab == null) {
                    // RESET Action
                    this.currentState = null;
                }

                // If there's a current state, then save it
                if (this.currentState) {
                    let currentTab = this.tabs.get(this.currentState.name);
                    currentTab.content = this._monacoEditor.getValue();
                    currentTab.model = this._monacoEditor.getModel();
                    currentTab.viewState = this._monacoEditor.saveViewState();
                }

                if (newTab) {
                    // Update the current state to the new tab
                    this.currentState = this.tabs.get(newTab);
                    let timer = AI.trackPageView(this.currentState.displayName, `/edit/${this.currentState.name}`);
                    if (this.currentState.name === 'script') {
                        this.updateIntellisense();
                    }
                    this._monacoEditor.setModel(this.currentState.model);
                    this._monacoEditor.restoreViewState(this._monacoEditor.saveViewState());
                    this._monacoEditor.focus();
                    this._resize();
                    timer.stop();
                }
            });
    }

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

            model.onDidChangeContent(() => this._debouncedInput());

            item.model = model;
            item.content = content;
            item.language = language;
            item.viewState = viewState;
        });

        this._snippet = snippet;
        this.changeTab();
    }

    /**
     * Update the active content property every 300ms.
     * The same update happens even on tab switch.
     */
    private _debouncedInput = debounce(() => {
        if (!this.isViewMode) {
            this.currentState.content = this._monacoEditor.getValue();
            this._store.dispatch(new Snippet.SaveAction(this.snippet));
        }
    }, 300);

    /**
     * Rehydrate the 'snippet' with the content from the various tabs.
     */
    private _snippet: ISnippet;
    public get snippet() {
        if (this._snippet == null) {
            return null;
        }

        ['script', 'template', 'style', 'libraries'].forEach(name => {
            let { content, language } = this.tabs.get(name);
            if (name === 'libraries') {
                this._snippet.libraries = content;
            }
            else {
                this._snippet[name] = { content, language };
            }
        });

        return this._snippet;
    }

    /**
     * Resize the Monaco Editor when ever there's a change in the
     * resolution. Also invoked when the menu is dismissed.
     */
    @HostListener('window:resize', ['$event'])
    private _resize() {
        if (this._monacoEditor) {
            setTimeout(() => {
                this._monacoEditor.layout();
                this._monacoEditor.setScrollTop(0);
                this._monacoEditor.setScrollLeft(0);
            }, 1);
        }
    }
}

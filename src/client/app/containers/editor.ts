import { Component, Input, HostListener, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs/Subscription';
import { debounce, isNil } from 'lodash';
import { Dictionary } from '@microsoft/office-js-helpers';
import * as fromRoot from '../reducers';
import {
    AI, environment, trustedSnippetManager, getSnippetDefaults,
    ensureFreshLocalStorage, storage
} from '../helpers';
import { Strings } from '../strings';
import { Monaco, Snippet } from '../actions';
import { MonacoService } from '../services';
import { isCustomFunctionScript } from '../../../server/core/snippet.helper';
const { localStorageKeys } = PLAYGROUND;

@Component({
    selector: 'editor',
    template: `
        <ul class="tabs ms-Pivot ms-Pivot--tabs" [hidden]="hide">
            <li class="tabs__tab ms-Pivot-link" *ngFor="let tab of tabs.values()" (click)="changeTab(tab.name)" [ngClass]="{'is-selected tabs__tab--active' : tab.name === currentState?.name, tabs__hidden: !showTab(tab.name)}">
                {{tab.displayName}}
            </li>
        </ul>
        <section class="trust-snippet-bar" *ngIf="!isSnippetTrusted">
            <div class="ms-MessageBar ms-MessageBar--warning ms-MessageBar-singleline" style="
                width: 100%;
                box-sizing: border-box;
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                justify-content: space-between;
                padding: 5px 0;
                ">
                <div class="ms-MessageBar-content" style="
                    box-sizing: border-box;
                    ">
                    <div class="ms-MessageBar-text" style="
                        box-sizing: border-box;
                        padding: 5px 0;
                        ">
                        <span class="ms-MessageBar-innerText" role="status" aria-live="polite" style="">
                        <span>{{strings.snippetNotTrusted}}</span>
                        </span>
                    </div>
                </div>
                <button type="button" class="ms-Button ms-Button--primary" data-is-focusable="true" (click)="trustSnippet()">
                    <div class="ms-Button-flexContainer">
                        <div class="ms-Button-textContainer">
                            <div class="ms-Button-label">{{strings.trust}}</div>
                        </div>
                    </div>
                </button>
            </div>
        </section>
        <section id="editor" #editor class="viewport"></section>
        <section [hidden]="!hide" class="viewport__placeholder"></section>
    `
})
export class Editor implements AfterViewInit {
    @ViewChild('editor') private _editor: ElementRef;
    @Input() isViewMode: boolean;
    private _monacoEditor: monaco.editor.IStandaloneCodeEditor;
    private menuSub: Subscription;
    private themeSub: Subscription;
    private snippetSub: Subscription;
    private tabSub: Subscription;
    private tabNames: string[];
    private currentDecorations: any[] = [];
    private currentCodeLensProvider: any;
    private perfInfoPoller: any;
    private previousPerfInfoTimestamp: number;

    private _snippet: ISnippet;
    private _isCustomFunctionSnippet: boolean;

    strings = Strings();

    tabs = new Dictionary<IMonacoEditorState>();
    currentState: IMonacoEditorState;
    hide: boolean = true;
    isSnippetTrusted = false;

    constructor(
        private _store: Store<fromRoot.State>,
        private _monaco: MonacoService
    ) {
        this.tabNames = ['script', 'template', 'style', 'libraries'];
        if (environment.current.supportsCustomFunctions) {
            this.tabNames.push('customFunctions');
        }
    }

    /**
     * Initialize the component and subscribe to all the necessary actions.
     */
    async ngAfterViewInit() {
        let _overrides = {
            theme: 'vs',
        };

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

    ngOnDestroy() {
        if (this.menuSub) {
            this.menuSub.unsubscribe();
        }
        if (this.themeSub) {
            this.themeSub.unsubscribe();
        }
        if (this.snippetSub) {
            this.snippetSub.unsubscribe();
        }
        if (this.tabSub) {
            this.tabSub.unsubscribe();
        }

        clearInterval(this.perfInfoPoller);
    }

    /**
     * Rehydrate the 'snippet' with the content from the various tabs.
     */
    public get snippet() {
        if (this._snippet == null) {
            return null;
        }

        this.tabNames.forEach(name => {
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

    trustSnippet() {
        trustedSnippetManager.trustSnippet(this.snippet.id);
        this.isSnippetTrusted = true;
        this._resize();
    }

    showTab = (tabName: string) => {
        if (this._isCustomFunctionSnippet) {
            return ['script', 'libraries'].indexOf(tabName) >= 0;
        }
        return true;
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

    startPerfInfoTimer() {
        if (this.perfInfoPoller) {
            return;
        }

        this.previousPerfInfoTimestamp = 0;
        this.perfInfoPoller = setInterval(() => {
            ensureFreshLocalStorage();
            const newPerfNums = Number(window.localStorage.getItem(localStorageKeys.lastPerfNumbersTimestamp));
            if (newPerfNums > this.previousPerfInfoTimestamp) {
                storage.snippets.load();
                let perfInfo = storage.snippets.get(this.snippet.id).perfInfo;
                if (perfInfo) {
                    if (perfInfo.timestamp >= this.snippet.modified_at) {
                        this.setPerformanceMarkers(perfInfo.data);
                    }
                }
                this.previousPerfInfoTimestamp = newPerfNums;
            }
        }, 500);
    }

    setPerformanceMarkers(perfInfo: PerfInfoItem[]) {
        const newDecorations = perfInfo.map(({ line_no, frequency, duration }) => {
            return {
                range: new monaco.Range(line_no, 1, line_no, 1),
                options: {
                    isWholeLine: true,
                    linesDecorationsClassName: 'perf-decorator',
                }
            };
        });
        this.currentDecorations = this._monacoEditor.deltaDecorations(this.currentDecorations, newDecorations);
        this.setCodeLensPerfNumbers(perfInfo);
    }

    clearPerformanceMakers() {
        this.previousPerfInfoTimestamp = 0;
        if (this.perfInfoPoller) {
            this.perfInfoPoller = clearInterval(this.perfInfoPoller);
        }

        this.setPerformanceMarkers([]);
    }

    setCodeLensPerfNumbers(perfInfo: PerfInfoItem[]) {
        if (this.currentCodeLensProvider) {
            this.currentCodeLensProvider.dispose();
        }
        this.currentCodeLensProvider = monaco.languages.registerCodeLensProvider('typescript', {
            provideCodeLenses: (model, token) => {
                return perfInfo.map(({ line_no, duration, frequency }) => {
                    return {
                        range: new monaco.Range(line_no, 1, line_no, 1),
                        id: `line_no${line_no}`,
                        command: {
                            id: null,
                            title: frequency === 1 ? `Duration: ${duration} ms.` : `Ran ${frequency} times. Total Duration: ${duration} ms.`
                        }
                    };
                });
            },
            resolveCodeLens: (model, codeLens, token) => {
                return codeLens;
            }
        });
    }

    private _createTabs() {
        this.tabNames.forEach(name => {
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
        this.menuSub = this._store.select(fromRoot.getMenu)
            .subscribe(() => this._resize());

        this.themeSub = this._store.select(fromRoot.getTheme)
            .subscribe(theme => monaco.editor.setTheme(theme ? 'vs' : 'vs-dark'));

        this.snippetSub = this._store.select(fromRoot.getCurrent)
            .filter(data => {
                this.hide = data == null;
                return !this.hide;
            })
            .subscribe(snippet => {
                this._store.dispatch(new Monaco.ResetAction());
                this._changeSnippet(snippet);
            });

        this.tabSub = this._store.select(fromRoot.getActiveTab)
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
                        this.setFlagForWhetherCustomFunction();
                    }

                    if (this.currentState.name === 'script') {
                        this.startPerfInfoTimer();
                    } else {
                        this.clearPerformanceMakers();
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

            let content: string;
            let language: string;

            if (item.name === 'libraries') {
                [content, language] = [snippet[item.name], item.name];
            } else {
                content = (snippet[item.name] || {}).content;
                language = (snippet[item.name] || {}).language;
            }

            if (isNil(content) || isNil(language)) {
                const defaults: IContentLanguagePair = getSnippetDefaults()[item.name];
                [content, language] = [defaults.content, defaults.language];
            }

            let model = monaco.editor.createModel(content, language);

            model.onDidChangeContent(() => this._debouncedInput());

            item.model = model;
            item.content = content;
            item.language = language;
            item.viewState = null;
        });

        this._snippet = snippet;
        this.isSnippetTrusted = trustedSnippetManager.isSnippetTrusted(this.snippet.id, this.snippet.gist, this.snippet.gistOwnerId);
        this.clearPerformanceMakers();
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
            this.clearPerformanceMakers();

            if (this.currentState.name === 'script') {
                this.setFlagForWhetherCustomFunction();
            }
        }
    }, 300);

    private setFlagForWhetherCustomFunction() {
        this._isCustomFunctionSnippet = isCustomFunctionScript(this.currentState.content);
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

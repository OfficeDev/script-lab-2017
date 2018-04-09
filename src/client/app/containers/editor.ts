import { Component, Input, HostListener, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs/Subscription';
import { debounce, isNil } from 'lodash';
import { Dictionary } from '@microsoft/office-js-helpers';
import * as fromRoot from '../reducers';
import {
    AI, environment, trustedSnippetManager, getSnippetDefaults,
    navigateToRegisterCustomFunctions,
    ensureFreshLocalStorage, storage
} from '../helpers';
import { UIEffects } from '../effects/ui';
import { Strings } from '../strings';
import { Monaco, Snippet } from '../actions';
import { MonacoService } from '../services';
const { localStorageKeys } = PLAYGROUND;

@Component({
    selector: 'editor',
    template: `
        <ul class="tabs ms-Pivot ms-Pivot--tabs" [hidden]="hide">
            <li class="tabs__tab ms-Pivot-link" *ngFor="let tab of tabs.values()" (click)="changeTab(tab.name)" [ngClass]="{'is-selected tabs__tab--active' : tab.name === currentState?.name}">
                {{tab.displayName}}
            </li>
        </ul>
        <section class="custom-functions" *ngIf="showRegisterCustomFunctions">
            <button (mouseover)="updateLastRegisteredFunctionsTooltip()" title="{{lastRegisteredFunctionsTooltip}}" class="ms-Button ms-Button--primary" (click)="registerCustomFunctions()" style="height: auto">
                <span class="ms-Button-label">{{registerCustomFunctionsButtonText}}</span>
            </button>
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

    strings = Strings();

    tabs = new Dictionary<IMonacoEditorState>();
    currentState: IMonacoEditorState;
    hide: boolean = true;
    showRegisterCustomFunctions = false;
    registerCustomFunctionsButtonText = this.strings.registerCustomFunctions;
    lastRegisteredFunctionsTooltip = '';
    isWaitingOnCustomFunctionsUpdate = false;

    constructor(
        private _store: Store<fromRoot.State>,
        private _uiEffects: UIEffects,
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

    changeTab = (name: string = 'script') => {
        let language = '';
        if (name !== 'libraries') {
            language = this.tabs.get(name).language;
        }

        this._store.dispatch(new Monaco.ChangeTabAction({ name: name, language }));
    }

    updateIntellisense(tabName: string) {
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

    async registerCustomFunctions() {
        if (!trustedSnippetManager.isSnippetTrusted(this.snippet.id, this.snippet.gist, this.snippet.gistOwnerId)) {
            let alertResult = await this._uiEffects.alert(
                this.strings.snippetNotTrusted,
                this.strings.trustSnippetQuestionMark,
                this.strings.trust,
                this.strings.cancel
            );
            if (alertResult === this.strings.cancel) {
                return;
            }
        }

        let startOfRequestTime = new Date().getTime();
        window.localStorage.setItem(
            localStorageKeys.customFunctionsLastUpdatedCodeTimestamp,
            startOfRequestTime.toString()
        );

        try {
            navigateToRegisterCustomFunctions();
        } catch (e) {
            await this._uiEffects.alert(e, 'Error registering custom functions', this.strings.ok);
        }

        // // If was already waiting (in vein) or heartbeat isn't running (not alive for > 3 seconds), update immediately
        // let updateImmediately = this.isWaitingOnCustomFunctionsUpdate ||
        //     getElapsedTime(getNumberFromLocalStorage(localStorageKeys.customFunctionsLastHeartbeatTimestamp)) > 3000;
        // if (updateImmediately) {
        //     navigateToCompileCustomFunctions('register');
        //     return;
        // }

        // // It seems like the heartbeat is running.  So give it a chance to pick up

        // // TODO CUSTOM FUNCTIONS:  This is a TEMPORARY DESIGN AND HENCE ENGLISH ONLY for the strings
        // this.registerCustomFunctionsButtonText = 'Attempting to update, this may take 10 or more seconds. Please wait (or click again to redirect to registration page, and see any accumulated errors)';
        // this.isWaitingOnCustomFunctionsUpdate = true;

        // let interval = setInterval(() => {
        //     let heartbeatCurrentlyRunningTimestamp = getNumberFromLocalStorage(
        //         localStorageKeys.customFunctionsCurrentlyRunningTimestamp);
        //     if (heartbeatCurrentlyRunningTimestamp > startOfRequestTime) {
        //         this.isWaitingOnCustomFunctionsUpdate = false;
        //         clearInterval(interval);
        //         this.registerCustomFunctionsButtonText = this.strings.registerCustomFunctions;
        //         this.updateLastRegisteredFunctionsTooltip();
        //     }
        // }, 2000);
    }

    // FIXME remove uncommented things
    // updateLastRegisteredFunctionsTooltip() {
    //     let currentlyRunningLastUpdated = getNumberFromLocalStorage(
    //         localStorageKeys.customFunctionsCurrentlyRunningTimestamp);
    //     if (currentlyRunningLastUpdated === 0) {
    //         return;
    //     }

    //     this.lastRegisteredFunctionsTooltip = this.strings.getTextForCustomFunctionsLastUpdated(
    //         moment(new Date(currentlyRunningLastUpdated)).locale(getDisplayLanguageOrFake()).fromNow(),
    //         moment(new Date(getNumberFromLocalStorage(localStorageKeys.customFunctionsLastHeartbeatTimestamp))).locale(getDisplayLanguageOrFake()).fromNow()
    //     );
    // }

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
                    if (this.currentState.name === 'script' || this.currentState.name === 'customFunctions') {
                        this.updateIntellisense(this.currentState.name);
                    }
                    if (this.currentState.name === 'script') {
                        this.startPerfInfoTimer();
                    } else {
                        this.clearPerformanceMakers();
                    }
                    this.showRegisterCustomFunctions = newTab === 'customFunctions';
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
            }
            else if (item.name === 'customFunctions') {
                content = (snippet[item.name] || {}).content;
                language = 'json';
            }
            else {
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

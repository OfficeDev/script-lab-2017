import { Component, OnDestroy, HostListener, Input, AfterViewInit, ViewChild, ElementRef, EventEmitter } from '@angular/core';
import { Http } from '@angular/http';
import { Dictionary } from '@microsoft/office-js-helpers';
import { Subscription } from 'rxjs/Subscription';
import { Utilities, PlaygroundError, UxUtil, Theme } from '../../helpers';
import { IntelliSenseHelper, IIntelliSenseResponse } from '../../helpers';
import { Tab } from './tab.component';
import { EditorComponent } from '../../../components';

export interface IEditorParent {
    currentIntelliSense: string[];
    onSwitchFocusToJavaScript?: () => void;
    isOfficeSnippet?: boolean
}

@Component({
    selector: 'tabs',
    template: `
    <ul class="tabs ms-Pivot ms-Pivot--tabs">
        <li class="tabs__tab ms-Pivot-link" *ngFor="let tab of values()" (click)="select(tab)" [ngClass]="{'is-selected tabs__tab--active': tab.active}">
            {{tab.alias||tab.name}}
        </li>
    </ul>
    <div class="tabs__container">
        <div #loader class="ms-progress">
            <div class="ms-Spinner large"></div>
            <div class="ms-ProgressIndicator-itemName ms-font-m ms-fontColor-white">Just one moment...</div>
            <div class="ms-ProgressIndicator-itemDescription ms-font-s-plus ms-fontColor-white">{{progressMessage}}...</div>
        </div>
        <section #editor class="monaco-editor"></section>
    </div>`,
    styleUrls: ['tab.component.scss']
})
export class Tabs extends Dictionary<Tab> implements AfterViewInit, OnDestroy {
    private _monacoEditor: monaco.editor.IStandaloneCodeEditor;
    private _monacoEditorInitialized: boolean;

    private _subscriptions: Subscription[] = [];

    selectedTab: Tab;
    @ViewChild('editor') private _editor: ElementRef;
    @ViewChild('loader') private _loader: ElementRef;

    @Input() readonly: boolean;

    progressMessage = 'Loading the snippet';
    editorLoaded: boolean;

    private _saveAction: () => void;

    editorParent: IEditorParent;

    private _modelsToDispose: monaco.IDisposable[] = [];

    constructor(private _http: Http) {
        super();
    }

    ngAfterViewInit() {
        let that = this;

        (<any>window).require(['vs/editor/editor.main'], () => {
            this._initializeMonacoEditor();
        });
    }

    ngOnDestroy() {
        this._subscriptions.forEach(subscription => {
            if (!subscription.closed) {
                subscription.unsubscribe();
            }
        });

        this._modelsToDispose.forEach(model => model.dispose());

        if (this._monacoEditor) {
            this._monacoEditor.dispose();
            console.log('Monaco editor disposed');
        }
    }

    initiateLoadIntelliSense(): Promise<void> {
        if (this.selectedTab.intellisense) {
            return this._waitForMonacoInitialization()
                .then(() => IntelliSenseHelper.retrieveIntelliSense(this._http, this.selectedTab.intellisense))
                .then(responses => {
                    IntelliSenseHelper.disposeAllMonacoLibInstances();

                    let errorUrls: string[] = [];
                    responses.forEach((responseIn: any) => {
                        let response: IIntelliSenseResponse = responseIn;
                        if (response.success) {
                            IntelliSenseHelper.recordNewlyAddedLib(
                                monaco.languages.typescript.typescriptDefaults.addExtraLib(response.data, response.url));
                            console.log('Added ' + response.url);
                        } else {
                            console.log(`Error fetching IntelliSense for "${response.url}": ${response.error}`);
                            errorUrls.push(response.url);
                        }
                    });

                    if (errorUrls.length > 0) {
                        throw new PlaygroundError('Error fetching IntelliSense for: \n' +
                            errorUrls.map((url) => '* ' + url).join('\n'));
                    }
                });
        }
    }

    private _waitForMonacoInitialization(): Promise<any> {
        if (this._monacoEditorInitialized) {
            return Promise.resolve();
        }

        return new Promise((resolve) => {
            let interval = setInterval(() => {
                if (this._monacoEditorInitialized) {
                    clearInterval(interval);
                    resolve();
                }
            }, 20);
        });
    }

    private _initializeMonacoEditor(): void {
        console.log('Beginning to initialize Monaco editor');

        monaco.languages.register({ id: 'script-references' });

        monaco.languages.setMonarchTokensProvider('script-references', {
            tokenizer: {
                root: [
                    [/^#.*/, 'comment'],

                    // Anything starting with @types or dt~ is IntelliSense
                    [/^(.types\/|dt~).*/i, 'string'],

                    [/^@.*/, ''],

                    // Anything starting with @types or dt~ is IntelliSense
                    [/^.*\.ts$/i, 'string'],

                    // Anything else presumed to be JS or CSS reference
                    [/.*/i, 'keyword'],
                ]
            },
            tokenPostfix: ''
        });

        this._monacoEditor = monaco.editor.create(this._editor.nativeElement, {
            value: '',
            language: 'text',
            lineNumbers: true,
            roundedSelection: false,
            scrollBeyondLastLine: false,
            wrappingColumn: 0,
            theme: 'vs-dark',
            wrappingIndent: 'indent',
            scrollbar: {
                vertical: 'visible',
                verticalHasArrows: true,
                arrowSize: 15
            },
            readOnly: this.readonly,
            model: null
        });

        $(this._editor.nativeElement).keydown((event) => {
            // Control (or Command) + S (83 = code for S)
            if ((event.ctrlKey || event.metaKey) && event.which === 83) {
                event.preventDefault();
                if (this._saveAction) {
                    this._saveAction();
                }
                return false;
            }
        });

        this._updateEditor(this.selectedTab);

        $(this._loader.nativeElement).hide();
        $(this._editor.nativeElement).show();
        this._monacoEditor.layout();

        console.log('Monaco editor initialized.');

        this._monacoEditorInitialized = true;
    }

    setSaveAction(action: () => void): void {
        this._saveAction = action;
    }

    get currentState(): { [index: string]: string } {
        if (!this._monacoEditor) {
            return null;
        }

        this.selectedTab.state = this._monacoEditor.saveViewState();
        this.selectedTab.model = this._monacoEditor.getModel();
        this.selectedTab.content = this._monacoEditor.getValue();

        let state = new Dictionary<string>();
        this.values().forEach(tab => {
            state.add(tab.name, tab.content);
        });

        return state.lookup();
    }

    add(name: string, tab: Tab) {
        if (this.count === 0) {
            this.select(tab);
        }

        let subscription = tab.update.subscribe(name => {
            this.get(name).model = null;
            if (this.selectedTab.name === name) {
                this._updateEditor(this.selectedTab);
            }
        });

        this._subscriptions.push(subscription);
        return super.add(tab.name, tab);
    }

    select(tab: Tab) {
        appInsights.trackEvent('Switch editor tabs', { type: 'UI Action', name: tab.name });

        let currentTab = null;
        this.selectedTab = tab;
        this.values().forEach(tab => {
            if (tab.active) {
                currentTab = tab;
            }
            tab.active = false;
        });

        this.selectedTab.active = true;
        this._updateEditor(tab, currentTab);
        this.initiateLoadIntelliSense();
    }

    @HostListener('window:resize', ['$event'])
    resize() {
        if (this._monacoEditor) {
            this._monacoEditor.layout();
            this._monacoEditor.setScrollTop(0);
            this._monacoEditor.setScrollLeft(0);
        }
    }

    private _updateEditor(nextTab: Tab, currentTab?: Tab) {
        if (this._monacoEditor == null) {
            return;
        }

        if (!(currentTab == null)) {
            currentTab.state = this._monacoEditor.saveViewState();
            currentTab.model = this._monacoEditor.getModel();
            currentTab.content = this._monacoEditor.getValue();
        }

        if (nextTab.model == null) {
            let newModel = monaco.editor.createModel(nextTab.content, nextTab.language);
            this._modelsToDispose.push(newModel);
            nextTab.model = newModel;
        }

        this._monacoEditor.setModel(nextTab.model);
        this._monacoEditor.restoreViewState(nextTab.state);
        this._monacoEditor.focus();

        if (nextTab.name === 'Script' && this.editorParent != null && this.editorParent.onSwitchFocusToJavaScript) {
            this.editorParent.onSwitchFocusToJavaScript();
        }
    }
}

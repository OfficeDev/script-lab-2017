import {Component, OnDestroy, HostListener, Input, AfterViewInit, ViewChild, ElementRef, EventEmitter} from '@angular/core';
import {Http} from '@angular/http';
import {Subscription} from 'rxjs/Subscription';
import {Dictionary, IDictionary, Utilities, UxUtil} from '../../helpers';
import {Tab} from './tab.component';
import {EditorComponent} from '../../../components';

export interface IContentUpdated {
    name: string;
    content: string;
}

interface IIntelliSenseResponse {
    url: string,
    success: boolean,
    data?: string,
    error?: string
}

export class IEditorParent {
    currentIntelliSense: string[];
    onSwitchFocusToJavaScript: () => void;
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
    private _subscriptions: Subscription[] = [];

    selectedTab: Tab;
    @Input() readonly: boolean;
    @ViewChild('editor') private _editor: ElementRef;
    @ViewChild('loader') private _loader: ElementRef;

    progressMessage = "Loading the snippet";
    editorLoaded: boolean;

    private _saveAction: () => void;

    editorParent: IEditorParent;

    constructor(private _http: Http) {
        super();
    }

    ngAfterViewInit() {
        var that = this;

        waitForIntelliSenseListToBeReady()
            .then(() => {
                // FXIME: realistically some of this time is loading editor as well, for fairness may want to refactor.
                this.progressMessage = "Initializing IntelliSense";
                (<any>window).require(['vs/editor/editor.main'], () => {
                    this._initiateLoadIntelliSense(this.editorParent.currentIntelliSense)
                        .catch(UxUtil.catchError("An error occurred while loading the IntelliSense."))
                        .then(() => {
                            this.progressMessage = "Loading the Monaco editor";
                            this._initializeMonacoEditor();
                        });
                });
            });

        function waitForIntelliSenseListToBeReady(): Promise<any> {
            return new Promise((resolve, reject) => {
                wait();

                function wait() {
                    if (that.editorParent == null || that.editorParent.currentIntelliSense == null) {
                        setTimeout(wait, 20);
                    } else {
                        resolve();
                    }
                }
            });
        }
    }

    ngOnDestroy() {
        this._subscriptions.forEach(subscription => {
            if (!subscription.isUnsubscribed) {
                subscription.unsubscribe();
            }
        });

        this._monacoEditor.dispose();
    }

    private _initiateLoadIntelliSense(urls: string[]): Promise<void> {
        var timeout = 10000;

        var promises = urls.map((url) => {
            return this._http.get(url)
                .timeout(timeout, new Error("Server took too long to respond to " + url))
                .toPromise()
                .then((data) => {
                    var response: IIntelliSenseResponse = {
                        url: url,
                        success: true,
                        data: data.text(), 
                    };
                    return response;
                })
                .catch((e) => {
                    var response: IIntelliSenseResponse = {
                        url: url, 
                        success: false,
                        error: e                        
                    };
                    return response;
                });
        });

        return Promise.all(promises)
            .then(responses => {
                var errorUrls: string[] = [];
                responses.forEach((responseIn) => {
                    var response: IIntelliSenseResponse = <any>responseIn;
                    if (response.success) {
                        try {
                            monaco.languages.typescript.typescriptDefaults.addExtraLib(response.data, response.url);
                            console.log("Added " + response.url);
                        } catch (e) {
                            // Ignore error. Monaco will say that it's already an extra lib... which is totally fine.
                        }
                    } else {
                        console.log(`Error fetching IntelliSense for "${response.url}": ${response.error}`);
                        errorUrls.push(response.url);
                    }
                })

                if (errorUrls.length > 0) {
                    throw new Error("Error fetching IntelliSense for: \n" +
                        errorUrls.map((url) => "* " + url).join("\n"));
                }
            });
    }

    private _initializeMonacoEditor(): void {
        console.log("Beginning to initialize Monaco editor");

        this._monacoEditor = monaco.editor.create(this._editor.nativeElement, {
            value: '',
            language: 'text',
            lineNumbers: true,
            roundedSelection: false,
            scrollBeyondLastLine: false,
            wrappingColumn: 0,
            readOnly: this.readonly,
            theme: "vs-dark",
            wrappingIndent: "indent"
        });

        $(this._editor.nativeElement).keydown((event) => {
            // Control (or Command) + S (83 = code for S)
            if((event.ctrlKey || event.metaKey) && event.which == 83) {
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
    }

    setSaveAction(action: () => void): void {
        this._saveAction = action;
    }

    get currentState(): IDictionary<string> {
        if (!this._monacoEditor) {
            return null;
        }
        
        this.selectedTab.state = this._monacoEditor.saveViewState();
        this.selectedTab.model = this._monacoEditor.getModel();
        this.selectedTab.content = this._monacoEditor.getValue();

        var state = new Dictionary<string>();
        this.values().forEach(tab => {
            state.add(tab.name, tab.content);
        });

        return state.lookup();
    }

    add(name: string, tab: Tab) {
        if (this.count == 0) {
            this.select(tab);
        }

        var subscription = tab.update.subscribe(name => {
            this.get(name).model = null;
            if (this.selectedTab.name === name) this._updateEditor(this.selectedTab);
        });

        this._subscriptions.push(subscription);
        return super.add(tab.name, tab);
    }

    select(tab: Tab) {
        var currentTab = null;
        this.selectedTab = tab;
        this.values().forEach(tab => {
            if (tab.active) {
                currentTab = tab;
            }
            tab.active = false
        });

        this.selectedTab.active = true;
        this._updateEditor(tab, currentTab);
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
        if (!Utilities.isNull(this._monacoEditor)) {
            if (!Utilities.isNull(currentTab)) {
                currentTab.state = this._monacoEditor.saveViewState();
                currentTab.model = this._monacoEditor.getModel();
                currentTab.content = this._monacoEditor.getValue();
            }

            if (Utilities.isNull(nextTab.model)) {
                nextTab.model = monaco.editor.createModel(nextTab.content, nextTab.language);
            }

            this._monacoEditor.setModel(nextTab.model);
            this._monacoEditor.restoreViewState(nextTab.state);
            this._monacoEditor.focus();

            if (nextTab.name === "JavaScript" && this.editorParent != null) {
                this.editorParent.onSwitchFocusToJavaScript();
            }
        }
    }
}
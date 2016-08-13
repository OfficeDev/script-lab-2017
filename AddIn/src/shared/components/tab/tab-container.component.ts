import {Component, OnDestroy, HostListener, Input, AfterViewInit, ViewChild, ElementRef, EventEmitter} from '@angular/core';
import {Http} from '@angular/http';
import {Subscription} from 'rxjs/Subscription';
import {Dictionary, IDictionary, Utilities} from '../../helpers';
import {Tab} from './tab.component';
import {EditorComponent} from '../../../components';

export interface IContentUpdated {
    name: string;
    content: string;
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
            <div class="ms-ProgressIndicator-itemName ms-font-m ms-fontColor-white">Initializing the code editor</div>
            <div class="ms-ProgressIndicator-itemDescription ms-font-s-plus ms-fontColor-white">Just one moment...</div>
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

    editorLoaded: boolean;

    private _saveAction: () => void;

    constructor(private _http: Http) {
        super();
    }

    ngAfterViewInit() {
        (<any>window).require(['vs/editor/editor.main'], () => {
            // FIXME: make dynamic

            Promise.all([
                this._http.get('https://npmcdn.com/@types/office-js/index.d.ts').toPromise(),
                this._http.get('https://npmcdn.com/@types/jquery/index.d.ts').toPromise(),
                this._http.get('https://npmcdn.com/@types/core-js/index.d.ts').toPromise(),
            ])
            .then(responses => {
                try {
                    monaco.languages.typescript.typescriptDefaults.addExtraLib(responses[0].text(), 'office-js.d.ts');
                    monaco.languages.typescript.typescriptDefaults.addExtraLib(responses[1].text(), 'jquery.d.ts');
                    monaco.languages.typescript.typescriptDefaults.addExtraLib(responses[2].text(), 'core-js.d.ts');                        
                }
                catch (e) {
                    console.log() // FIXME
                }

                this._monacoEditor = monaco.editor.create(this._editor.nativeElement, {
                    value: '',
                    language: 'text',
                    lineNumbers: true,
                    roundedSelection: false,
                    scrollBeyondLastLine: false,
                    wrappingColumn: 0,
                    readOnly: this.readonly,
                    theme: "vs-dark"
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
            });
        });
    }

    ngOnDestroy() {
        this._subscriptions.forEach(subscription => {
            if (!subscription.isUnsubscribed) {
                subscription.unsubscribe();
            }
        });

        this._monacoEditor.dispose();
    }

    setSaveAction(action: () => void): void {
        this._saveAction = action;
    }

    get currentState(): IDictionary<string> {
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
        this._monacoEditor.layout();
        this._monacoEditor.setScrollTop(0);
        this._monacoEditor.setScrollLeft(0);
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
        }
    }
}
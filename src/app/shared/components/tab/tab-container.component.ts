import { Component, OnDestroy, HostListener, Input, AfterViewInit, ViewChild, ElementRef, EventEmitter } from '@angular/core';
import { Http } from '@angular/http';
import { Dictionary } from '@microsoft/office-js-helpers';
import { Subscription } from 'rxjs/Subscription';
import { Utilities, PlaygroundError, UxUtil, Theme } from '../../helpers';
import { Monaco } from '../../services';
import { Tab } from './tab.component';

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
    private _subscriptions: Subscription[] = [];
    private _monacoEditor: monaco.editor.IStandaloneCodeEditor;

    selectedTab: Tab;
    @ViewChild('editor') private _editor: ElementRef;
    @ViewChild('loader') private _loader: ElementRef;
    @Input() readonly: boolean;
    progressMessage = 'Loading the snippet';

    constructor(private _monaco: Monaco) {
        super();
    }

    ngAfterViewInit() {
        this._monaco.create(this._editor).then(monacoEditor => this._monacoEditor = monacoEditor);
    }

    ngOnDestroy() {
        this._subscriptions.forEach(subscription => {
            if (!subscription.closed) {
                subscription.unsubscribe();
            }
        });

        if (this._monacoEditor) {
            this._monacoEditor.dispose();
        }
    }

    initiateLoadIntelliSense() {
        if (this.selectedTab.intellisense) {
            this._monaco.updateLibs(this.selectedTab.language, this.selectedTab.intellisense);
        }
    }

    // private _initializeMonacoEditor(): void {
    // $(this._editor.nativeElement).keydown(event => {
    //     if ((event.ctrlKey || event.metaKey) && event.which === 83) {
    //         event.preventDefault();
    //         return false;
    //     }
    // });
    // }

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

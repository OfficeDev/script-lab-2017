import { Component, ViewChild, OnInit, OnDestroy, ElementRef, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MonacoEditorTabs } from '../shared/components';
import { BaseComponent } from '../shared/components/base.component';
import { Monaco, Snippet, SnippetManager } from '../shared/services';
import { Utilities, Theme, MessageStrings, ExpectedError, PlaygroundError, UxUtil } from '../shared/helpers';
import * as _ from 'lodash';

enum StatusType {
    info,
    warning,
    error
}

@Component({
    selector: 'editor',
    templateUrl: 'editor.component.html',
    styleUrls: ['editor.component.scss']
})
export class EditorComponent extends BaseComponent implements OnInit, OnDestroy {
    snippet: Snippet;
    status: string;
    statusType: StatusType;
    editMode = false;
    @ViewChild('name') nameInputField: ElementRef;

    constructor(
        private _router: Router,
        private _monaco: Monaco,
        private _snippetManager: SnippetManager,
        private _route: ActivatedRoute,
        private _changeDetectorRef: ChangeDetectorRef
    ) {
        super();
    }

    ngOnInit() {
        let subscription = this._route.params.subscribe(params => {
            if (params['id'] == null) {
                this._snippetManager.new().then(snippet => {
                    this.snippet = snippet;
                    this._monaco.updateLibs('typescript', this.snippet.typings);
                });
            }
            else {
                this._snippetManager.find(params['id'])
                    .then(snippet => {
                        this.snippet = snippet;
                        this._monaco.updateLibs('typescript', this.snippet.typings);
                    });
            }
        });

        this.markDispose(subscription);
    }

    save(): Promise<void> {
        // appInsights.trackEvent('Save', { type: 'UI Action', id: this.snippet.content.id, name: this.snippet.content.name });
        console.log(JSON.stringify(this.snippet.content));
        return;
        // return this._saveHelper()
        //     .then((snippet) => {
        //         this._showStatus(StatusType.info, 3 /*seconds*/, `Saved "${snippet.name}"`);
        //     })
        //     .catch(this._errorHandler);
    }

    run() {
        // appInsights.trackEvent('Run from Editor', { type: 'UI Action', id: this.snippet.content.id, name: this.snippet.content.name });
        this._post('https://office-playground-runner.azurewebsites.net', { snippet: JSON.stringify(this.snippet.content) });
    }

    get isStatusWarning() { return this.statusType === StatusType.warning; }
    get isStatusError() { return this.statusType === StatusType.error; }

    private _post(path, params) {
        let form = document.createElement('form');
        form.setAttribute('method', 'post');
        form.setAttribute('action', path);

        for (let key in params) {
            if (params.hasOwnProperty(key)) {
                let hiddenField = document.createElement('input');
                hiddenField.setAttribute('type', 'hidden');
                hiddenField.setAttribute('name', key);
                hiddenField.setAttribute('value', params[key]);

                form.appendChild(hiddenField);
            }
        }

        document.body.appendChild(form);
        form.submit();
    }
}

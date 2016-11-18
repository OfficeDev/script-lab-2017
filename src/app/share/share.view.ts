import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { Http } from '@angular/http';
import { ViewBase } from '../shared/components/base';
import { Snippet, SnippetStore, Github } from '../shared/services';
import './share.view.scss';

@Component({
    selector: 'share',
    templateUrl: 'share.view.html'
})
export class ShareView extends ViewBase {
    constructor(
        private _snippetManager: SnippetStore,
        private _github: Github
    ) {
        super();
    }
}
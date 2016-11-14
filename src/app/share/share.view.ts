import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { Http } from '@angular/http';
import { ViewBase } from '../shared/components/base';
import { Snippet, SnippetManager, Github } from '../shared/services';
import './share.view.scss';

@Component({
    selector: 'share',
    templateUrl: 'share.view.html'
})
export class ShareView extends ViewBase {
    constructor(
        private _snippetManager: SnippetManager,
        private _github: Github
    ) {
        super();
    }
}
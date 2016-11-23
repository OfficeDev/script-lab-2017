import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { Http } from '@angular/http';
import { Snippet, SnippetStore, Github, Disposable } from '../shared/services';
import './share.view.scss';

@Component({
    selector: 'share',
    templateUrl: 'share.view.html'
})
export class ShareView extends Disposable {
    constructor(
        private _snippetManager: SnippetStore,
        private _github: Github
    ) {
        super();
    }
}
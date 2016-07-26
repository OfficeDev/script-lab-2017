import {Component, OnInit, ElementRef, ViewChild, ViewQuery} from '@angular/core';
import {COMMON_DIRECTIVES} from '@angular/common';

declare const require: any;

@Component({
    selector: 'editor',
    templateUrl: 'editor.component.html',
    styleUrls: ['editor.component.scss'],
    directives: [COMMON_DIRECTIVES]
})
export class EditorComponent implements OnInit {
    @ViewChild('editor') editorContent: ElementRef;

    constructor(
    ) {
    }

    ngOnInit() {
        var onGotAmdLoader = () => {
            // Load monaco
            (<any>window).require(['vs/editor/editor.main'], () => {
                this.initMonaco();
            });
        };

        // Load AMD loader if necessary
        if (!(<any>window).require) {
            var loaderScript = document.createElement('script');
            loaderScript.type = 'text/javascript';
            loaderScript.src = 'vs/loader.js';
            loaderScript.addEventListener('load', onGotAmdLoader);
            document.body.appendChild(loaderScript);
        } else {
            onGotAmdLoader();
        }
    }

    // Will be called once monaco library is available
    initMonaco() {
        var myDiv: HTMLDivElement = this.editorContent.nativeElement;
        var editor = monaco.editor.create(myDiv, {
            value: [
                'function x() {',
                '\tconsole.log("Hello world!");',
                '}'
            ].join('\n'),
            language: 'javascript'
        });
    }
}
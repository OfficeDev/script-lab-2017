import {Component, OnInit, OnDestroy, ViewContainerRef} from '@angular/core';
import {BaseComponent} from '../components';
// http://teropa.info/blog/2016/03/06/writing-an-angular-2-template-directive.html

@Component({
    selector: 'monaco-editor'
})
export class MonacoEditor extends BaseComponent implements OnInit, OnDestroy {
    constructor(private viewContainerRef: ViewContainerRef) {
        super();
    }

    ngOnInit() {
        console.log(this.viewContainerRef);

        /*var editor = monaco.editor.create(document.getElementById('container'), {
            value: [
                'function x() {',
                '\tconsole.log("Hello world!");',
                '}'
            ].join('\n'),
            language: 'javascript'
        });*/
    }
}
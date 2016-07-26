import {Directive, OnInit, OnDestroy} from '@angular/core';
import {BaseComponent} from '../shared/components/base.component';

// http://teropa.info/blog/2016/03/06/writing-an-angular-2-template-directive.html

@Directive({
    selector: 'monaco-editor'
})
export class MonacoEditor extends BaseComponent implements OnInit, OnDestroy {
    ngOnInit() {

    }
}
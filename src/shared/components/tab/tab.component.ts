import {Component, Input, OnInit, ViewChild, ElementRef} from '@angular/core';
import {Tabs} from './tab-container.component';

declare const require: any;

@Component({
    selector: 'tab',
    template: '<div [hidden]="!active" #editor class="tab__editor"></div>',
    styleUrls: ['tab.component.scss']
})
export class Tab {
    @Input() name: string;
    @Input() active: boolean;
    @Input() content: string;
    @Input() language: string;
    @ViewChild('editor') private _editor: ElementRef;

    constructor(private tabs: Tabs) {
        this.innerHtml    
    }

    ngOnInit() {
        this.tabs.add(this.name, this);
        this.initMonaco();
    }

    initMonaco() {
        (<any>window).require(['vs/editor/editor.main'], () => {
            var editor = monaco.editor.create(this._editor.nativeElement, {
                language: "typescript",
                lineNumbers: true,
                roundedSelection: false,
                scrollBeyondLastLine: false,
                readOnly: false
            });
        });
    }
}
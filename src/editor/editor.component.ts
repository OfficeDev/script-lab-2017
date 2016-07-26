import {Component, OnInit, ElementRef, ViewChild, ViewQuery} from '@angular/core';
import {COMMON_DIRECTIVES} from '@angular/common';

declare const monaco: any;
declare const require: any;

@Component({
    selector: 'editor',
    templateUrl: 'editor.component.html',
    styleUrls: ['editor.component.scss'],
    directives: [COMMON_DIRECTIVES]
})
export class EditorComponent implements OnInit {
    ngOnInit() {
        var container = document.getElementById('container');
        console.log(container, monaco);
        // var editor = monaco.editor.create(container, {
        //     value: [
        //         'function x() {',
        //         '\tconsole.log("Hello world!");',
        //         '}'
        //     ].join('\n'),
        //     language: 'javascript'
        // });
    }

}
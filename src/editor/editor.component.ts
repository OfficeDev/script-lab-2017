import {Component, OnInit} from '@angular/core';

@Component({
    selector: 'editor',
    templateUrl: 'editor.component.html',
    styleUrls: ['editor.component.scss']
})
export class EditorComponent implements OnInit {
    ngOnInit() {
        var container = document.getElementById('container');
        console.log(container, monaco);
        var editor = monaco.editor.create(container, {
            value: [
                'function x() {',
                '\tconsole.log("Hello world!");',
                '}'
            ].join('\n'),
            language: 'javascript'
        });
    }
}
import {Component, OnInit, ViewChild, ElementRef} from '@angular/core';

declare const require: any;

@Component({
    selector: 'editor',
    templateUrl: 'editor.component.html',
    styleUrls: ['editor.component.scss']
})
export class EditorComponent implements OnInit {
    @ViewChild('editor') private _editor: ElementRef;

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
        var editor = monaco.editor.create(this._editor.nativeElement, {
            value: `// First line
function hello() {
    alert('Hello world!');
}
// Last line

class MyEditor {
    helloWorld() {
        console.log('Hello World');
    }
}

var editor = new MyEditor();
editor.helloWorld();`,
            language: "typescript",
            lineNumbers: true,
            roundedSelection: false,
            scrollBeyondLastLine: false,
            readOnly: false
        });
    }
}
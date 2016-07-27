import {Component, OnInit} from '@angular/core';
import {Tab, Tabs} from '../shared/components';

@Component({
    selector: 'editor',
    templateUrl: 'editor.component.html',
    styleUrls: ['editor.component.scss'],
    directives: [Tab, Tabs]
})
export class EditorComponent implements OnInit {
    css: string = '.hello{display:block} .helloWorld{display:none}';
    js: string = 'var person = function() { console.log(\'person\'); }; person();';
    html: string = '<html><body><script>alert(\'hello\');</script></body></html';
    text: string = '#this is a readme file. ##it doesnt nothing';
    
    ngOnInit() {

    }
}
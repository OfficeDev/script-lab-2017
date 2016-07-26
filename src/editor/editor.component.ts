import {Component, OnInit} from '@angular/core';
import {Tab, Tabs} from '../shared/components';

@Component({
    selector: 'editor',
    templateUrl: 'editor.component.html',
    styleUrls: ['editor.component.scss'],
    directives: [Tab, Tabs]
})
export class EditorComponent implements OnInit {
    ngOnInit() {

    }
}
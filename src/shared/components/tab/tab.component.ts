import {Directive, EventEmitter, Input, Output, OnChanges, SimpleChanges} from '@angular/core';
import {Tabs} from './tab-container.component';

declare const require: any;

@Directive({
    selector: 'tab'
})
export class Tab implements OnChanges {
    @Input() name: string;
    @Input() active: boolean;
    @Input() content: string;
    @Input() language: string;
    @Output() update = new EventEmitter();

    state: monaco.editor.IEditorViewState;
    model: monaco.editor.IModel;

    constructor(private tabs: Tabs) { }

    ngOnInit() {
        this.state = null;
        this.model = null;
        this.tabs.add(this.name, this);
    }

    ngOnChanges(changes: SimpleChanges) {
        this.model = null;    
        this.update.next(this.name);
    }
}
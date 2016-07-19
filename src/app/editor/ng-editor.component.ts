import {Component} from '@angular/core';
import {Utils} from '../shared/helpers';

@Component(Utils.component('editor', { stylesUrl: null }))
export class NgEditor {
    date: string;

    edit() {
        console.log('Angular Blah Blah');
        this.date = Date().toString();
    }    
}
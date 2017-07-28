import { Component } from '@angular/core';
import { Strings } from '../strings';

@Component({
    selector: 'view-error',
    template: `
        <main>strings.viewModeError</main>
    `
})

export class ViewModeError {
    strings = Strings();
}

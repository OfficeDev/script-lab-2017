import { Component } from '@angular/core';
import { Strings } from '../strings';

@Component({
    selector: 'view-mode-error',
    template: `
    <div>
        <h1 class="ms-font-xxl">{{strings.viewModeError}}</h1>
    </div>
    `
})

export class ViewModeError {
    strings = Strings();
}

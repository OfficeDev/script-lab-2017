import { Pipe, PipeTransform } from '@angular/core';
import * as map from 'lodash/map';

@Pipe({ name: 'keys' })
export class KeysPipe implements PipeTransform {
    transform(values: any): any {
        if (values == null) {
            return [];
        }

        return map(values, (value, key) => {
            return { key, value };
        });
    }
}

import { Pipe, PipeTransform } from '@angular/core';
import { map } from 'lodash';

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

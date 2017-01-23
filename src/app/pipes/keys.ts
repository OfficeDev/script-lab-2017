import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'keys' })
export class KeysPipe implements PipeTransform {
    transform(values: any): any {
        if (values == null) {
            return [];
        }

        return _.map(values, (value, key) => {
            return { key, value };
        });
    }
}

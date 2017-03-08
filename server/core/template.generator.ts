import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';
import { Utilities } from './Utilities';

handlebars.registerHelper('indent', (text, indent) => Utilities.indentAll(text, indent));

export function loadTemplate<T>(templateName: string) {
    return new Promise<(context: T) => string>((resolve, reject) => {
        let templateUrl = path.resolve(`${__dirname}/../assets/${templateName}`);
        fs.readFile(templateUrl, 'UTF8', (err, file) => {
            if (err) {
                return reject(err);
            }

            let template = handlebars.compile(file);
            return resolve((context: T) => template(context));
        });
    });
}


import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';
import { indentAll } from './utilities';

handlebars.registerHelper('indent', (text: string, indent: number) => {
    // Skip first (0th) line, since that one is already indented by virtue of its placement
    return indentAll(text, indent, 1 /*startingAtLine*/);
});

export function loadTemplate<T>(templateName: string) {
    return new Promise<(context: T) => string>((resolve, reject) => {
        let templateUrl = path.resolve(`${__dirname}/../templates/${templateName}`);
        fs.readFile(templateUrl, 'UTF8', (err, file) => {
            if (err) {
                return reject(err);
            }

            let template = handlebars.compile(file);
            return resolve((context: T) => template(context));
        });
    });
}

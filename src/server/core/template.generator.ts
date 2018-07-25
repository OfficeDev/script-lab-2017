import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';
import { indentAll } from './utilities';
import { forIn, clone } from 'lodash';

handlebars.registerHelper('indent', (text: string, indent: number) => {
  // Skip first (0th) line, since that one is already indented by virtue of its placement
  return indentAll(text, indent, 1 /*startingAtLine*/);
});

// Note: to use a versionedPackageNames_xyz variable here,
// be sure to both declare it here, assign in it "server.ts",
// and reference it in "const versionedPackageNames" in "webpack.common.js"
export interface IDefaultHandlebarsContext {
  origin: string;
  assets: { [key: string]: any };
  officeJsOrLocal: string;
  versionedPackageNames_office_ui_fabric_js: string;
  versionedPackageNames_jquery: string;
  versionedPackageNames_jquery_resizable_dom: string;
}

export function loadTemplateHelper<T>(
  templateName: string,
  defaults: IDefaultHandlebarsContext
) {
  return new Promise<(context: T) => string>((resolve, reject) => {
    let templateUrl = path.resolve(`${__dirname}/../templates/${templateName}`);
    fs.readFile(templateUrl, 'UTF8', (err, file) => {
      if (err) {
        return reject(err);
      }

      let template = handlebars.compile(file);
      return resolve((context: T) => {
        let fullContext = clone(context);
        forIn(defaults, (value, key) => {
          fullContext[key] = value;
        });
        return template(fullContext, { strict: true });
      });
    });
  });
}

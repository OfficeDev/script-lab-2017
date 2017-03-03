import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';
import { PlatformType } from '@microsoft/office-js-helpers';
import { CompiledSnippet } from './snippet.generator';
import { Utilities } from './Utilities';

class TemplateGenerator {
    constructor() {
        handlebars.registerHelper('indentAll', (text, indent) => Utilities.indentAll(text, indent));
    }

    generate(templateRelativeUrl: string, context: any): Promise<string> {
        return new Promise((resolve, reject) => {
            let templateUrl = path.resolve(`${__dirname}/../assets/${templateRelativeUrl}`);
            fs.readFile(templateUrl, 'UTF8', (err, data) => {
                try {
                    if (err != null) {
                        reject(err);
                    } else {
                        let template = handlebars.compile(data);
                        resolve(template(context));
                    }
                }
                catch (error) {
                    reject(error);
                }
            });
        });
    }
}

export const templateGenerator = new TemplateGenerator();

export class SnippetTemplateGenerator {
    static createOuterTemplateContext(
        frameContent: string,
        { host, origin, platform }: IRunnerState,
        compiledSnippet: CompiledSnippet
    ): IOuterTemplateData {
        return {
            snippetName: compiledSnippet.name,
            snippetAuthor: compiledSnippet.author,
            iframeContent: frameContent,
            hostLowercase: host.toLowerCase(),
            returnUrl: `${origin}\index.html`,
            refreshUrl: `${origin}\refresh.html`, /* TODO: Include all the refresh parameters */
            OfficeJsRefIfAny: compiledSnippet.officeJsRefIfAny,
            isOfficeSnippet: compiledSnippet.isOfficeSnippet,
            addPaddingRight: platform === PlatformType.PC
        }
    }
}

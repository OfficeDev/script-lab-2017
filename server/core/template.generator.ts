import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';
import { CompiledSnippet } from './snippet.generator';
import { Utilities } from './Utilities';

export class TemplateGenerator {
    static initCodeHelpers() {
        handlebars.registerHelper('indentAll', (text, indent) => Utilities.indentAll(text, indent));
    }

    static generate(templateRelativeUrl: string, context: any): Promise<string> {
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

export class SnippetTemplateGenerator {
    static createOuterTemplateContext(
        frameContent: string,
        data: IRunnerPostData,
        compiledSnippet: CompiledSnippet
    ): IOuterTemplateData {
        return {
            snippetName: compiledSnippet.name,
            snippetAuthor: compiledSnippet.author,
            iframeContent: frameContent,
            hostLowercase: data.host.toLowerCase(),
            returnUrl: data.returnUrl,
            refreshUrl: generateRefreshUrl(),
            OfficeJsRefIfAny: compiledSnippet.officeJsRefIfAny,
            isOfficeSnippet: compiledSnippet.isOfficeSnippet,
            addPaddingRight: data.platform === "PC"
        }

        function generateRefreshUrl(): string {
            const propsToSkipOver = {
                snippet: true,
                refreshUrl: true
            }

            let params = [];

            for (let property in data) {
                if (!propsToSkipOver[property] && data[property] != null) {
                    params.push(property + '=' + encodeURIComponent(data[property]));
                }
            }

            return data.refreshUrl + '?' + params.join('&');
        }
    }
}

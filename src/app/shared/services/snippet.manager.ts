import { Injectable } from '@angular/core';
import { Storage } from '@microsoft/office-js-helpers';
import { Request } from './request';
import { Snippet, SnippetNamingSuffixOption } from './snippet';
import { Utilities, ContextUtil, MessageStrings, ContextType, ExpectedError, PlaygroundError, UxUtil } from '../helpers';

@Injectable()
export class SnippetManager {
    private _snippetsContainer: Storage<ISnippet>;
    private currentContext: string;

    constructor(private _request: Request) {
    }
    /**
     * Must be called from every controller to ensure that the snippet manager uses
     * a correct snippet context (Excel vs. Word vs. Web).
     */
    initialize() {
        this._snippetsContainer = new Storage<ISnippet>(ContextUtil.contextString + '_snippets');
    }

    randomizeId(force: boolean, snippet: Snippet): Snippet {
        do {
            var localSnippets = this.getLocal();
            if (force || Utilities.isEmpty(snippet.content.id) || snippet.content.id.indexOf('~!L') == -1) {
                snippet.content.id = '~!L' + Utilities.randomize(Math.max(10000, localSnippets.length * 10)).toString();
            }
        }
        while (localSnippets.find(item => (item.id === snippet.content.id)));

        return snippet;
    }

    public makeNameUnique(suffixOption: SnippetNamingSuffixOption, snippet: Snippet): void {
        if (Utilities.isNullOrWhitespace(snippet.content.name)) {
            snippet.content.name = MessageStrings.NewSnippetName;
        }

        if (this.isNameUnique(snippet.content)) {
            return;
        }

        var prefix = generatePrefix(snippet.content.name);

        var i = 1;
        while (true) {
            snippet.content.name = prefix + ' ' + i;
            if (this.isNameUnique(snippet.content)) {
                return;
            }
            i++;
        }

        // Helper functions

        function generatePrefix(name: string): string {
            var prefix = Utilities.stringOrEmpty(name);

            switch (suffixOption) {
                case SnippetNamingSuffixOption.UseAsIs:
                    return prefix + ' - ';

                case SnippetNamingSuffixOption.AddCopySuffix:
                    // If name doesn't have "copy" in it, try to use "<name> - copy".
                    // Otherwise (or if the copy one is already taken), find the first available "<name> - copy <number>".
                    var regex = /(.*) - copy( \d+)?$/i;
                    /*  Will match these:
                            test - copy
                            test - copy 1
                            test - copy 2
                            test - copy 222
                        But not these:
                            test
                            test - copy 222 gaga
                    */
                    var regexMatches = regex.exec(name);

                    if (regexMatches) {
                        prefix = regexMatches[1];
                    }

                    return prefix + ' - copy';

                case SnippetNamingSuffixOption.StripNumericSuffixAndIncrement:
                    // Does it end with just a number on the end?  If so, grab just the text
                    var regex = /(.*) \d+$/;
                    /* Will match these:
                            test 1
                            test 122
                        But not these:
                            test
                            test - copy
                            test - copy 222 gaga
                    */

                    var regexMatches = regex.exec(name);

                    if (regexMatches) {
                        prefix = regexMatches[1];
                    }

                    return prefix;
            }
        }
    }

    /** Note: assume both this snippet's name and all other snippets have had their names trimmed of spaces */
    public isNameUnique(snippet: ISnippet) {
        return Utilities.isNull(
            this.getLocal().find(item => item.id != snippet.id && item.name == snippet.name)
        );
    }

    new(): Promise<Snippet> {
        return this.add(SnippetManager.createBlankSnippet(this),
            SnippetNamingSuffixOption.StripNumericSuffixAndIncrement);
    }

    add(snippet: Snippet, suffixOption: SnippetNamingSuffixOption): Promise<Snippet> {
        return new Promise(resolve => {
            this.randomizeId(true /*force*/, snippet);
            this.makeNameUnique(suffixOption, snippet);
            resolve(this._addSnippetToLocalStorage(snippet));
        });
    }

    duplicate(snippet: ISnippet): Promise<Snippet> {
        return this.add(new Snippet(snippet), SnippetNamingSuffixOption.AddCopySuffix);
    }

    save(snippet: Snippet): Promise<ISnippet> {
        if (Utilities.isNull(snippet)) {
            return Promise.reject(new Error('Snippet metadata cannot be empty')) as any;
        }

        if (Utilities.isEmpty(snippet.content.name)) {
            return Promise.reject(new Error('Snippet name cannot be empty')) as any;
        }

        snippet.content.name = snippet.content.name.trim();
        if (!this.isNameUnique(snippet.content)) {
            return Promise.reject(new Error('Snippet name must be unique')) as any;
        }

        snippet.lastSavedHash = snippet.getHash();
        return Promise.resolve(this._snippetsContainer.insert(snippet.content.id, snippet.content));
    }

    delete(snippet: Snippet, askForConfirmation: boolean): Promise<any> {
        if (Utilities.isNull(snippet)) {
            return Promise.reject(new Error('Snippet metadata cannot be empty'));
        }

        var that = this;

        if (askForConfirmation) {
            return UxUtil.showDialog('Delete confirmation',
                `Are you sure you want to delete the snippet "${snippet.content.name}"?`, ['Yes', 'No'])
                .then((choice) => {
                    if (choice === 'Yes') {
                        return deleteAndResolvePromise();
                    } else {
                        return Promise.reject(new ExpectedError());
                    }
                });
        } else {
            return deleteAndResolvePromise();
        }

        function deleteAndResolvePromise(): Promise<any> {
            that._snippetsContainer.remove(snippet.content.id);
            return Promise.resolve();
        }
    }

    deleteAll(askForConfirmation: boolean): Promise<any> {
        var that = this;

        if (askForConfirmation) {
            return UxUtil.showDialog('Delete confirmation',
                'Are you sure you want to delete *ALL* of your local snippets?', ['Yes', 'No'])
                .then((choice) => {
                    if (choice === 'Yes') {
                        return deleteAndResolvePromise();
                    } else {
                        return Promise.reject(new ExpectedError());
                    }
                });
        } else {
            return deleteAndResolvePromise();
        }

        function deleteAndResolvePromise(): Promise<any> {
            that._snippetsContainer.clear();
            return Promise.resolve();
        }
    }

    /**
     * Returns a list of local snippets.  Note that the initialize function of SnippetManager
     * MUST be called before issuing this call, or else you'll always get an empty list.
     */
    getLocal(): ISnippet[] {
        if (this._snippetsContainer) {
            return this._snippetsContainer.values();
        }

        return [];
    }

    getPlaylist(): Promise<ISnippetGallery> {
        var snippetJsonUrl = `snippets/${ContextUtil.contextString}.json?rand=${new Date().getTime()}`;

        return (this._request.local<ISnippetGallery>(snippetJsonUrl) as Promise<ISnippetGallery>)
            .catch((e) => {
                var messages = ['Could not retrieve default snippets for ' + ContextUtil.hostName + '.'];
                Utilities.appendToArray(messages, UxUtil.extractErrorMessage(e));
                throw new PlaygroundError(messages);
            });
    }

    find(id: string): Promise<Snippet> {
        return new Promise(resolve => {
            var result = this._snippetsContainer.get(id);
            resolve(new Snippet(result));
        });
    }

    private _addSnippetToLocalStorage(snippet: Snippet) {
        this._snippetsContainer.add(snippet.content.id, snippet.content);
        return snippet;
    }

    static createBlankSnippet(snippetManager: SnippetManager) {
        if (ContextUtil.isOfficeContext) {
            return createBlankOfficeJsSnippet();
        } else {
            // Theoretically shouldn't happen, but leaving it in just in case:
            createBlankGenericSnippet();
        }

        function createBlankOfficeJsSnippet(): Snippet {
            var script: string;

            // For new host-specific APIs, use the new syntax
            // However, if detect that this is running inside an add-in and on an old client,
            // Revert back to the Office 2013 code.
            var useHostSpecificApiSample = (ContextUtil.contextNamespace != null);
            if (ContextUtil.isAddin && !Office.context.requirements.isSetSupported(ContextUtil.contextNamespace + 'Api')) {
                useHostSpecificApiSample = false;
            }

            if (useHostSpecificApiSample) {
                script = Utilities.stripSpaces(`
        $('#run').click(function () {
            invokeRun()
                .catch(OfficeHelpers.logError);
        });

        function invokeRun() {
            return ${ContextUtil.contextNamespace}.run(function (context) {
                `) +
                    '\n' + Utilities.indentAll(Utilities.stripSpaces(getHostSpecificSample()), 2) +
                    '\n        ' +
                    '\n' + Utilities.stripSpaces(`
                return context.sync();
            });
        }
        `);
            } else {
                script = Utilities.stripSpaces(`
        $('#run').click(invokeRun);

        function invokeRun() {
            Office.context.document.getSelectedDataAsync(Office.CoercionType.Text,
                function (asyncResult) {
                    if (asyncResult.status === Office.AsyncResultStatus.Failed) {
                        console.log(asyncResult.error.message);
                    } else {
                        console.log('Selected data is ' + asyncResult.value);
                    }
                }
            );
        }
        `);
            }

            function getHostSpecificSample() {
                switch (ContextUtil.context) {
                    case ContextType.Excel:
                        return Utilities.stripSpaces(`
        // Insert your code here. For example:
        var range = context.workbook.getSelectedRange();
        range.format.fill.color = "yellow";
        `);

                    case ContextType.Word:
                        return Utilities.stripSpaces(`
        // Insert your code here. For example:
        var range = context.document.getSelection();
        range.font.color = "purple";
        `);

                    default:
                        return '// Insert your code here...';
                }
            }

            var snippet = new Snippet({
                name: '',
                id: '',
                script: {
                    language: 'typescript',
                    content: script
                },
                template: {
                    language: 'html',
                    content: Utilities.stripSpaces(`
            < p class="ms-font-m" >
                Execute a code snippet in the Office Add-in Playground
                    < /p>

                    < button id= "run" class="ms-Button" >
                        <span class="ms-Button-label" > Run code< /span>
                            < /button>
                                `),
                },
                style: {
                    language: 'css',
                    content: SnippetManager.getDefaultCss()
                }
            });

            snippet.libraries = Utilities.stripSpaces(`
                # Office.js CDN reference
                ${ContextUtil.officeJsBetaUrl}

                # Other CDN references.Syntax: NPM package name, NPM package path, or raw URL to CDN location.
                    jquery
                core - js / client / core.min.js
                office - ui - fabric / dist / js / jquery.fabric.min.js
                office - ui - fabric / dist / css / fabric.min.css
                office - ui - fabric / dist / css / fabric.components.min.css

                # IntelliSense definitions.Syntax: "dt~library_name" for DefinitelyTyped, "@typings/library_name" for Typings, or raw URL to d.ts location.
                    dt~jquery
                dt~core - js
                dt~office - js

                # Note: for any "loose" typescript definitions, you can paste them at the bottom of your TypeScript/ JavaScript code in the "Script" tab.
                        `);

            return snippet;
        }
        function createBlankGenericSnippet(): Snippet {
            var snippet = new Snippet({
                id: '',
                name: '',
                script: {
                    content: 'console.log("Hello world");',
                    language: 'typescript'
                }
            });

            snippet.libraries = Utilities.stripSpaces(`
        # CDN references.Syntax: NPM package name, NPM package path, or raw URL to CDN location.
            jquery
        core - js / client / core.min.js
        office - ui - fabric / dist / js / jquery.fabric.min.js
        office - ui - fabric / dist / css / fabric.min.css
        office - ui - fabric / dist / css / fabric.components.min.css

        # IntelliSense definitions.Syntax: "dt~library_name" for DefinitelyTyped, "@typings/library_name" for Typings, or raw URL to d.ts location.
            dt~jquery
        dt~core - js

        # Note: for any "loose" typescript definitions, you can paste them at the bottom of your TypeScript/ JavaScript code in the "Script" tab.
                `);

            return snippet;
        }
    }

    static getDefaultCss(): string {
        return Utilities.stripSpaces(`
        body {
            padding: 5px 10px;
        }

            .ms - Button, .ms - Button:focus {
            background: ${ContextUtil.themeColor};
            border: ${ContextUtil.themeColor};
        }
                .ms - Button > .ms - Button - label,
                .ms - Button:focus > .ms - Button - label,
                .ms - Button:hover > .ms - Button - label {
            color: white;
        }
                .ms - Button:hover, .ms - Button:active {
            background: ${ContextUtil.themeColorDarker};
        } `
        );
    }
}

export interface ISnippetGallery {
    groups: Array<{
        name: string,
        items: Array<{
            name: string,
            description: string,
            gistId: string
        }>
    }>
}

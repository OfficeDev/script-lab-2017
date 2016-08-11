import {Snippet} from '../services';
import {Utilities} from './utilities';

export interface ICreateHtmlOptions {
    inlineJsAndCssIntoIframe: boolean,
    includeOfficeInitialize: boolean
}

export class SnippetWriter {
    static createHtml(snippet: Snippet, options: ICreateHtmlOptions): Promise<string> {
        return snippet.js.then(js => {
            var html = [
                '<!DOCTYPE html>',
                '<html>',
                '<head>',
                '    <meta charset="UTF-8" />',
                '    <meta http-equiv="X-UA-Compatible" content="IE=Edge" />',
                '    <title>Running snippet</title>',
                snippet.getJsLibaries().map(item => '    <script src="' + item + '"></script>').join("\n"),
                snippet.getCssStylesheets().map((item) => '    <link rel="stylesheet" href="' + item + '" />').join("\n"),
            ];

            if (options.inlineJsAndCssIntoIframe) {
                html.push(
                    "    <style>",
                    snippet.css.trim(),
                    "    </style>"
                );

                var jsStringArray = [];
                if (options.includeOfficeInitialize) {
                    jsStringArray.push('        Office.initialize = function (reason) {');
                }

                jsStringArray.push('            $(document).ready(function () {');

                if (options.inlineJsAndCssIntoIframe) {
                    jsStringArray.push('                parent.iframeReadyCallback(window);');
                }
                
                jsStringArray.push(
                    js.trim(),
                    '            });'
                );

                if (options.includeOfficeInitialize) {
                    jsStringArray.push('        };');
                }

                var beautify = require('js-beautify').js_beautify;
                var jsString = Utilities.indentAll(
                    Utilities.stripSpaces(beautify(jsStringArray.join("\n"))),
                    2);

                html.push(
                    "    <script>",
                    jsString,
                    "    </script>"
                );
            } else {
                html.push(
                    "    <link type='text/css' rel='stylesheet' href='app.css' />",
                    "    <script src='app.js'></script>"
                );
            }

            html.push(
                '</head>',
                '<body>',
                Utilities.indentAll(snippet.html, 1),
                '</body>',
                '</html>'
            );

            return Utilities.stripSpaces(html.join('\n'));
        })
    }
}
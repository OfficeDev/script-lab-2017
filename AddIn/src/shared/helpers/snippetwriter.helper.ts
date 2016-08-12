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
                '	 <script src="https://npmcdn.com/jquery"></script>',
                snippet.getJsLibaries().map(item => '    <script src="' + item + '"></script>').join("\n"),
                snippet.getCssStylesheets().map((item) => '    <link rel="stylesheet" href="' + item + '" />').join("\n"),
            ];

            if (options.inlineJsAndCssIntoIframe) {
                html.push(
                    "    <style>",
                    Utilities.stringOrEmpty(snippet.css).trim(),
                    "    </style>"
                );

                var jsStringArray = [];
                
                if (options.inlineJsAndCssIntoIframe) {
                    jsStringArray.push('parent.iframeReadyCallback(window);');
                }

                if (options.includeOfficeInitialize) {
                    jsStringArray.push('Office.initialize = function (reason) {');
                }

                jsStringArray.push('$(document).ready(function () {');
                
                if (Utilities.isNullOrWhitespace(snippet.html)) {
                    jsStringArray.push('$("#invoke-action").click(invokeAction);');
                } else {
                    jsStringArray.push(js.trim());
                }

                jsStringArray.push('});');

                if (options.includeOfficeInitialize) {
                    jsStringArray.push('};');
                }

                if (Utilities.isNullOrWhitespace(snippet.html)) {
                    jsStringArray.push(
                        'function invokeAction() {',
                        js.trim(),
                        '}'
                    );
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

            var htmlBody = Utilities.isNullOrWhitespace(snippet.html) ? 
                '<button id="invoke-action">Invoke action</button>' : snippet.html;

            html.push(
                '</head>',
                '<body>',
                Utilities.indentAll(htmlBody, 1),
                '</body>',
                '</html>'
            );

            return Utilities.stripSpaces(html.join('\n'));
        })
    }
}
import {Component, OnInit, OnDestroy, ViewChild, ElementRef} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {BaseComponent} from '../shared/components/base.component';
import {Utilities} from '../shared/helpers';
import {Snippet, SnippetManager} from '../shared/services';
import {} from "js-beautify";

interface CreateHtmlOptions {
    inlineJsAndCssIntoIframe: boolean,
    includeOfficeInitialize: boolean
}

@Component({
    selector: 'run',
    templateUrl: 'run.component.html',
    styleUrls: ['run.component.scss'],
})
export class RunComponent extends BaseComponent implements OnInit, OnDestroy {
    @ViewChild('runner') runner: ElementRef;
    @ViewChild('console') console: ElementRef;
    snippet: Snippet;

    private _originalConsole: Console;
    private _createHtmlOptions: CreateHtmlOptions

    constructor(
        private _snippetManager: SnippetManager,
        private _route: ActivatedRoute,
        private _router: Router
    ) {
        super();
        this._originalConsole = window.console;
        this._monkeyPatchConsole(window);

        this._createHtmlOptions = {
            includeOfficeInitialize: false /*FIXME*/,
            inlineJsAndCssIntoIframe: true
        }; 
    }

    ngOnInit() {
        var subscription = this._route.params.subscribe(params => {
            var snippetName = Utilities.decode(params['name']);
            if (Utilities.isEmpty(snippetName)) return;
            this.snippet = this._snippetManager.findByName(snippetName);

            var iframe = this.runner.nativeElement;
            var iframeWindow: Window = (<any>iframe).contentWindow;
            this.createHtml(this._createHtmlOptions).then(function (fullHtml) {
                iframeWindow.document.open();
                iframeWindow.document.write(fullHtml);
                iframeWindow.document.close();
            }).catch(function (e) {
                console.log(e);
                // TODO eventually Util instead
            });
        });

        this.markDispose(subscription);

        window["iframeReadyCallback"] = (iframeWin) => {
            if (this._createHtmlOptions.includeOfficeInitialize) {
                iframeWin['Office'] = (<any>window).Office;
                iframeWin['Excel'] = (<any>window).Excel;
            }

            this._monkeyPatchConsole(iframeWin);
            
            var that = this;
            iframeWin.onerror = function() {
                that.logToConsole('error', arguments);
            }
        }
    }

    ngOnDestroy() {
        super.ngOnDestroy();
        console = this._originalConsole;
    }

    createHtml(options: CreateHtmlOptions): Promise<string> {
        return this.snippet.js.then(js => {
            var html = [
                '<!DOCTYPE html>',
                '<html>',
                '<head>',
                '    <meta charset="UTF-8" />',
                '    <meta http-equiv="X-UA-Compatible" content="IE=Edge" />',
                '    <title>Running snippet</title>',
                this.snippet.getJsLibaries().map(item => '    <script src="' + item + '"></script>').join("\n"),
                this.snippet.getCssStylesheets().map((item) => '    <link rel="stylesheet" href="' + item + '" />').join("\n"),
            ];

            if (options.inlineJsAndCssIntoIframe) {
                html.push(
                    "    <style>",
                    this.snippet.css.trim(),
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
                Utilities.indentAll(this.snippet.html, 1),
                '</body>',
                '</html>'
            );

            return Utilities.stripSpaces(html.join('\n'));
        })
    }

    private _monkeyPatchConsole(windowToPatch: Window) {
        // Taken from http://tobyho.com/2012/07/27/taking-over-console-log/
        var console = windowToPatch.console;
        var that = this;
        if (!console) return
        function intercept(method){
            var original = console[method];
            console[method] = function() {
                that.logToConsole(method, arguments);
                if (original.apply){
                    // Do this for normal browsers
                    original.apply(console, arguments);
                }else{
                    // Do this for IE
                    var message = Array.prototype.slice.apply(arguments).join(' ');
                    original(message);
                }
            }
        }
        var methods = ['log', 'warn', 'error'];
        for (var i = 0; i < methods.length; i++) {
            intercept(methods[i]);
        }
    }

    private logToConsole(consoleMethodType: string, args: IArguments) {
        var message = '';
        _.each(args, arg => {
            if (_.isString(arg)) message += arg + ' ';
            else if (_.object(arg) || _.isArray(arg)) message += stringifyPlusPlus(arg) + ' ';
        });
        message += '\n';
        var span = document.createElement("span");
        span.classList.add("console");
        span.classList.add(consoleMethodType);
        span.innerText = message;
        $(this.console.nativeElement).append(span);

        function stringifyPlusPlus(object) {
            // Don't JSON.stringify strings, because we don't want quotes in the output
			if (typeof object == 'string' || object instanceof String) {
				return object;
			} else if (object.toString() != "[object Object]") {
				return object.toString();
			}
			// Otherwise, stringify the object
			else {
				return JSON.stringify(object, function (key, value) {
					if (value && typeof value === "object" && !$.isArray(value)) {
						return getStringifiableSnapshot(value);
					}
					return value;
				}, "  ");
			}

            function getStringifiableSnapshot(object: any) {
                try {
                    var snapshot: any = {};
                    var current = object;
                    var hasOwnProperty = Object.prototype.hasOwnProperty;
                    function tryAddName(name: string) {
                        if (name.indexOf("_") < 0 &&
                            !hasOwnProperty.call(snapshot, name)) {
                            Object.defineProperty(snapshot, name, {
                                configurable: true,
                                enumerable: true,
                                get: function () {
                                    return object[name];
                                }
                            });
                        }
                    }
                    do {
                        Object.keys(current).forEach(tryAddName);
                        current = Object.getPrototypeOf(current);
                    } while (current);
                    return snapshot;
                } catch (e) {
                    return object;
                }
            }
        }
    }

    back() {
        this._router.navigate(['edit', Utilities.encode(this.snippet.meta.name)]);
    }
}
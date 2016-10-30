import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { BaseComponent } from '../shared/components/base.component';
import { Utilities, ContextUtil, ContextType, SnippetWriter, ICreateHtmlOptions, UxUtil, PlaygroundError } from '../shared/helpers';
import { Snippet, SnippetManager } from '../shared/services';

interface IConsoleMessage {
    type: string,
    message: string
}

@Component({
    selector: 'run',
    templateUrl: 'run.component.html',
    styleUrls: ['run.component.scss'],
})
export class RunComponent extends BaseComponent implements OnInit, OnDestroy {
    @ViewChild('runner') runner: ElementRef;
    @ViewChild('console') consoleFrame: ElementRef;

    private _snippet: Snippet;

    private _originalConsole: Console;
    private _consoleMethodsToIntercept = ['log', 'warn', 'error'];
    private _originalConsoleMethods: { [key: string]: () => void; } = {};

    private _returnToEdit: boolean;

    constructor(
        _router: Router,
        _snippetManager: SnippetManager,
        private _route: ActivatedRoute,
        private _changeDetectorRef: ChangeDetectorRef
    ) {
        super(_router, _snippetManager);
        this._snippet = new Snippet({});
    }

    loaded = false;
    loadingMessage = 'Preparing the snippet to run...';
    showConsole = false;
    consoleMessages: IConsoleMessage[] = [];

    ngOnInit() {
        if (!this._ensureContext()) {
            return;
        }

        this._originalConsole = window.console;

        this._consoleMethodsToIntercept.forEach(methodName => {
            this._originalConsoleMethods[methodName] = window.console[methodName];
        });

        var createHtmlOptions: ICreateHtmlOptions = {
            inlineJsAndCssIntoIframe: true
        };

        var subscription = this._route.params.subscribe(params => {
            this._returnToEdit = params['returnToEdit'] === 'true';
            this._snippetManager.find(params['id'])
                .then(snippet => {
                    this._snippet = snippet;
                })
                .then(() => {
                    if (this._snippet.containsOfficeJsReference &&
                        !ContextUtil.getGlobalState(ContextUtil.windowkey_officeInitialized)) {
                        this.loadingMessage = 'Your snippet specifies Office.js as one of the referenced libraries. ' +
                            'The playground is waiting for Office.js to initialize. ' +
                            'Note that Office.js can only run inside of an Office Add-in, so if you\'re not using it, ' +
                            'just remove it from te "Libraries" tab in the script editor.';

                        return new Promise((resolve) => {
                            wait();

                            function wait() {
                                setTimeout(() => {
                                    if (ContextUtil.getGlobalState(ContextUtil.windowkey_officeInitialized)) {
                                        resolve();
                                    } else {
                                        wait();
                                    }
                                }, 50);
                            }
                        });
                    }
                })
                .then(() => SnippetWriter.createHtml(this._snippet, createHtmlOptions))
                .then(fullHtml => {
                    var iframe = this.runner.nativeElement;
                    var iframeWindow: Window = (<any>iframe).contentWindow;

                    iframeWindow.document.open();
                    iframeWindow.document.write(fullHtml);

                    this._monkeyPatchConsole(iframeWindow);

                    var that = this;
                    iframeWindow.onerror = function () {
                        that.logToConsole('error', arguments);
                    };

                    iframeWindow.onload = () => {
                        console.log("Frame loaded");

                        this.loaded = true;
                        this._changeDetectorRef.detectChanges();

                        if (this._snippet.containsOfficeJsReference) {
                            iframeWindow['Office'] = (<any>window).Office;
                            iframeWindow['OfficeExtension'] = (<any>window).OfficeExtension;
                            iframeWindow['Excel'] = (<any>window).Excel;
                            iframeWindow['Word'] = (<any>window).Word;
                            iframeWindow['OneNote'] = (<any>window).OneNote;

                            var requestedOfficeJs = this._snippet.getOfficeJsReference();
                            var normalizeReference = Utilities.normalizeUrl(requestedOfficeJs).toLowerCase();
                            if (normalizeReference !== ContextUtil.officeJsBetaUrl) {
                                this.logToConsole("warn", [
                                    "FYI: For now, the playground is hard-coded to use the Beta CDN for Office.js " +
                                    "(regardless of the Library reference), " +
                                    "but we are working on enabling version-selection in the very near future."
                                ]);
                            }
                        }
                    };

                    iframeWindow.document.close();
                })
                .catch((e) => {
                    UxUtil.showErrorNotification("Error while loading the snippet", [], e)
                        .then(() => {
                            this._navigateToEdit();
                        });
                });
        });

        this.markDispose(subscription);
    }

    ngOnDestroy() {
        super.ngOnDestroy();

        this._consoleMethodsToIntercept.forEach(methodName => {
            window.console[methodName] = this._originalConsoleMethods[methodName];
        });
    }

    private _monkeyPatchConsole(windowToPatch: Window) {
        // Taken from http://tobyho.com/2012/07/27/taking-over-console-log/
        var console = windowToPatch.console;
        var that = this;
        if (!console) return

        var intercept = (methodName) => {
            var original = console[methodName];
            console[methodName] = function () {
                that.logToConsole(methodName, arguments);
                if (original.apply) {
                    original.apply(console, arguments);
                } else {
                    // If no "apply" method (Internet Explorer), use a different approach
                    var message = Array.prototype.slice.apply(arguments).join(' ');
                    original(message);
                }
            }
        }

        this._consoleMethodsToIntercept.forEach(methodName => {
            intercept(methodName);
        });
    }

    clearConsole() {
        this.consoleMessages = [];
    }

    hideConsole() {
        this.showConsole = false;
    }

    private logToConsole(consoleMethodType: string, args: IArguments | Array<any>) {
        var message = '';

        _.each(args, arg => {
            if (_.isString(arg)) message += arg + ' ';
            else if (_.isObject(arg) || _.isArray(arg)) message += Utilities.stringifyPlusPlus(arg) + ' ';
        });
        message += '\n';

        var trimmedMessage = message.trim();
        if (trimmedMessage === "Agave.HostCall.IssueCall" ||
            trimmedMessage === "Agave.HostCall.ReceiveResponse"
        ) {
            return;
        }

        this.consoleMessages.push({
            type: consoleMethodType,
            message: message
        })
        this.showConsole = true;

        this._changeDetectorRef.detectChanges();

        var $consoleScrollable = $(this.consoleFrame.nativeElement).children('.scrollable')[0];
        $consoleScrollable.scrollTop = $consoleScrollable.scrollHeight;
    }

    back() {
        if (this._returnToEdit) {
            this._navigateToEdit();
        } else {
            this._router.navigate(['new']);
        }
    }

    _navigateToEdit() {
        this._router.navigate(['edit', this._snippet.meta.id]);
    }

    reloadPage() {
        Utilities.reloadPage();
    }
}
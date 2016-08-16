import {Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {BaseComponent} from '../shared/components/base.component';
import {Utilities, ContextType, SnippetWriter, ICreateHtmlOptions, ErrorUtil} from '../shared/helpers';
import {Snippet, SnippetManager} from '../shared/services';

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

    private _snippet = new Snippet({ meta: { name: null, id: null } });

    private _originalConsole: Console;
    private _consoleMethodsToIntercept = ['log', 'warn', 'error'];
    private _originalConsoleMethods: { [key: string]: () => void; } = {};
    
    private _returnToEdit: boolean;

    constructor(
        private _snippetManager: SnippetManager,
        private _route: ActivatedRoute,
        private _router: Router,
        private _changeDetectorRef: ChangeDetectorRef
    ) {
        super();
    }

    showConsole = false;
    consoleMessages: IConsoleMessage[] = [];

    ngOnInit() {
        this._originalConsole = window.console;

        this._consoleMethodsToIntercept.forEach(methodName => {
            this._originalConsoleMethods[methodName] = window.console[methodName];
        });

        this._monkeyPatchConsole(window);

        var createHtmlOptions: ICreateHtmlOptions = {
            includeOfficeInitialize: Utilities.context != ContextType.Web,
            inlineJsAndCssIntoIframe: true
        };

        var subscription = this._route.params.subscribe(params => {
            this._returnToEdit = params['returnToEdit'] === 'true';
            this._snippetManager.find(params['id'])
                .then(snippet => {
                    this._snippet = snippet;
                    return SnippetWriter.createHtml(this._snippet, createHtmlOptions);
                })
                .then(fullHtml => {
                    var iframe = this.runner.nativeElement;
                    var iframeWindow: Window = (<any>iframe).contentWindow;
                    iframeWindow.document.open();
                    iframeWindow.document.write(fullHtml);
                    iframeWindow.document.close();
                })
                .catch(e => {
                    ErrorUtil.notifyUserOfError(e);
                });
        });


        this.markDispose(subscription);

        window["iframeReadyCallback"] = (iframeWin) => {
            if (createHtmlOptions.includeOfficeInitialize) {
                iframeWin['Office'] = (<any>window).Office;
                iframeWin['Excel'] = (<any>window).Excel;
            }

            this._monkeyPatchConsole(iframeWin);

            var that = this;
            iframeWin.onerror = function () {
                that.logToConsole('error', arguments);
            }
        }
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
                    // Do this for normal browsers
                    original.apply(console, arguments);
                } else {
                    // Do this for IE
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

    private logToConsole(consoleMethodType: string, args: IArguments) {
        var message = '';
        _.each(args, arg => {
            if (_.isString(arg)) message += arg + ' ';
            else if (_.object(arg) || _.isArray(arg)) message += Utilities.stringifyPlusPlus(arg) + ' ';
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
            this._router.navigate(['edit', this._snippet.meta.id, false /*new*/]);
        } else {
            this._router.navigate(['new']);            
        }
    }

    refresh() {
        window.location.reload();
    }
}
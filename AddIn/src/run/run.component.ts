import {Component, OnInit, OnDestroy, ViewChild, ElementRef} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {BaseComponent} from '../shared/components/base.component';
import {Utilities} from '../shared/helpers';
import {Snippet, SnippetManager} from '../shared/services';

@Component({
    selector: 'run',
    templateUrl: 'run.component.html',
    styleUrls: ['run.component.scss'],
})
export class RunComponent extends BaseComponent implements OnInit, OnDestroy {
    @ViewChild('runner') runner: ElementRef;
    @ViewChild('console') console: ElementRef;
    snippet: Snippet;

    private _originalConsole;

    constructor(
        private _snippetManager: SnippetManager,
        private _route: ActivatedRoute,
        private _router: Router
    ) {
        super();
        this._monkeyPatchConsole();
    }

    ngOnInit() {
        var subscription = this._route.params.subscribe(params => {
            var snippetName = Utilities.decode(params['name']);
            if (Utilities.isEmpty(snippetName)) return;
            this.snippet = this._snippetManager.findByName(snippetName);

            var iframe = this.runner.nativeElement;
            var iframeWindow: Window = (<any>iframe).contentWindow;
            this.createHtml().then(function (fullHtml) {
                iframeWindow.document.open();
                iframeWindow.document.write(fullHtml);
                iframeWindow.document.close();
            }).catch(function (e) {
                // eventually Util instead
            });
        });

        this.markDispose(subscription);

        window["iframeReadyCallback"] = (iframeWin) => {
            iframeWin['Office'] = (<any>window).Office;
            iframeWin['Excel'] = (<any>window).Excel;

            iframeWin.console.log = this.consoleCommon.bind(this);
            iframeWin.console.error = this.consoleCommon.bind(this);

            iframeWin.onerror = this.consoleCommon.bind(this);
        }
    }

    ngOnDestroy() {
        super.ngOnDestroy();
        console = this._originalConsole;
    }

    createHtml(): Promise<string> {
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
                "    <style>",
                this.snippet.css,
                "    </style>",
                "    <script>",
                '        Office.initialize = function (reason) {',
                '            $(document).ready(function () {',
                js,
                '            });',
                '        };',
                "    </script>",
                '</head>',
                '<body onload="parent.iframeReadyCallback(this.window)">',
                this.snippet.html,
                '</body>',
                '</html>'
            ].join('\n');

            return Utilities.stripSpaces(html);
        })
    }

    private _monkeyPatchConsole() {
        this._originalConsole = console;
        console.log = this.consoleCommon.bind(this);
        console.error = this.consoleCommon.bind(this);
    }

    // consoleLog() {
    //     this.consoleCommon("log", arguments);
    // }

    // consoleError(...args) {
    //     this.consoleCommon("error", arguments);
    // }

    // private consoleCommon(spanClass: string, ...argsDifferent) {
    //     var message = '';
    //     var args = _.rest(arguments, 1);
    //     _.each(args, arg => {
    //         if (_.isString(arg)) message += arg + ' ';
    //         else if (_.object(arg) || _.isArray(arg)) message += JSON.stringify(arg) + ' ';
    //     });
    //     message += '\n';
    //     var span = document.createElement("span");
    //     span.classList.add(spanClass);
    //     span.innerText = message;
    //     $(this.console.nativeElement).append(span);
    // }

    private consoleCommon() {
        var message = _.first(arguments);
        var args = _.rest(arguments, 1);        
        _.each(args, arg => {
            if (_.isString(arg)) message += arg + ' ';
            else if (_.object(arg) || _.isArray(arg)) message += JSON.stringify(arg) + ' ';
        });
        message += '\n';
        var span = document.createElement("span");
        span.classList.add('error');
        span.innerText = message;
        $(this.console.nativeElement).append(span);
    }

    back() {
        this._router.navigate(['edit', Utilities.encode(this.snippet.meta.name)]);
    }
}
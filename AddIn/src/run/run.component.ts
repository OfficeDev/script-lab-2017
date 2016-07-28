import {Component, OnInit, OnDestroy, ViewChild, ElementRef} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
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
    snippet: Snippet;

    constructor(
        private _snippetManager: SnippetManager,
        private _route: ActivatedRoute
    ) {
        super();
    }


    ngOnInit() {
        var subscription = this._route.params.subscribe(params => {
            var snippetName = Utilities.decode(params['name']);
            if (Utilities.isEmpty(snippetName)) return;
            this.snippet = this._snippetManager.findByName(snippetName);

            var iframe = this.runner.nativeElement;
            var iframeWindow: Window = (<any>iframe).contentWindow;
            this.createHtml().then(function(fullHtml) {
                iframeWindow.document.open();
                iframeWindow.document.write(fullHtml);
                iframeWindow.document.close();
            }).catch(function(e) {
                console.log(e);
                // eventually Util instead
            });
        });

        this.markDispose(subscription);

        window["iframeReadyCallback"] = function(iframeWin) {
            iframeWin['Office'] = (<any>window).Office;
            iframeWin['Excel'] = (<any>window).Excel;
        }
    }

    createHtml(): Promise<string> {
        return this.snippet.js.then((js) => {
            return Utilities.stripSpaces(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8" />
                    <meta http-equiv="X-UA-Compatible" content="IE=Edge" />
                    <title>Running snippet</title>
                `)
                +
                this.snippet.getJsLibaries().map(item => '    <script src="' + item + '"></script>').join("\n")
                + "\n" +
                this.snippet.getCssStylesheets().map((item) => '    <link rel="stylesheet" href="' + item + '" />').join("\n")
                + "\n" +
                "    <style>" +
                this.snippet.css +
                "    </style>" +
                "    <script>\n"
                + Utilities.stripSpaces(`
                    Office.initialize = function (reason) {
                        $(document).ready(function () {
                    `)
                + "\n" +
                js
                + Utilities.stripSpaces(`
                        });
                    };
                    `)
                +
                "    </script>"
                +
                Utilities.stripSpaces(`
                </head>
                <body onload="parent.iframeReadyCallback(this.window)">`
                )
                +
                this.snippet.html
                +
                Utilities.stripSpaces(
                `            
                </body>
                </html>
                `
                );
        })
    }
}
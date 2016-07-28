import {Component, OnInit, OnDestroy} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {Tab, Tabs} from '../shared/components';
import {BaseComponent} from '../shared/components/base.component';
import {Snippet, SnippetManager} from '../shared/services';
import {Utilities} from '../shared/helpers';

@Component({
    selector: 'editor',
    templateUrl: 'editor.component.html',
    styleUrls: ['editor.component.scss'],
    directives: [Tab, Tabs]
})
export class EditorComponent extends BaseComponent implements OnInit, OnDestroy {
    snippet: Snippet;

    constructor(
        private _router: Router,
        private _snippetManager: SnippetManager,
        private _route: ActivatedRoute
    ) {
        super();
    }

    switchToRun() {
        this._router.navigate(['run', this.initialParamsName]);
    }

    private initialParamsName: string;
    ngOnInit() {
        var subscription = this._route.params.subscribe(params => {
            this.initialParamsName = params['name'];
            console.log("Initial params name " + this.initialParamsName)
            var snippetName = Utilities.decode(params['name']);
            if (Utilities.isEmpty(snippetName)) return;
            this.snippet = this._snippetManager.findByName(snippetName);
        });

        this.snippet = this.createDefaultNewSnippet();

        this.markDispose(subscription);
    }

    createDefaultNewSnippet(): Snippet {
        var meta = {
            name: 'Unnamed Snippet',
            id: 'asbsdasds'
        };

        var ts = Utilities.stripSpaces(`
            $("#sample-button").click(runSample);

            function runSample() {
                // This sample will color the selected range in yellow, and also display the selection address.
                Excel.run(function (ctx) {
                    var range = ctx.workbook.getSelectedRange();
                    range.load('address');
                    return ctx.sync()
                        .then(function () {
                            showNotification("Range address is", range.address);
                        });
                })
                .catch(handleError);
            }
            
            function handleError(error) {
                showNotification("Error", error);
                // Log additional information to the console, if applicable:
                if (error instanceof OfficeExtension.Error) {
                    console.log("Debug info: " + JSON.stringify(error.debugInfo));
                }
            }

            function showNotification(header, text) {
                var container = document.getElementById('notification-popup');
                var headerPlaceholder = container.querySelector('.notification-popup-title');
                var textPlaceholder = container.querySelector('.ms-MessageBanner-clipper');

                headerPlaceholder.textContent = header;
                textPlaceholder.textContent = text;
                    
                var closeButton = container.querySelector('.ms-MessageBanner-close');
                closeButton.addEventListener("click", function () {
                    if (container.className.indexOf("hide") === -1) {
                        container.className += " hide";
                        setTimeout(function () {
                            container.className = "ms-MessageBanner is-hidden";
                        }, 500);
                    }
                    closeButton.removeEventListener("click");
                });

                container.className = "ms-MessageBanner is-expanded";
            }
		`);

        var html = Utilities.stripSpaces(`
            <div id="content-main">
                <h1>Sample snippet</h1>
                <h3>This sample will color the selected range in yellow, and also display the selection address.</h3>
                <p>Switch to the JS and CSS views to see more</p>
                <button id="sample-button">Run sample!</button>
            </div>

            <div id="notification-popup" class="ms-MessageBanner is-hidden">
                <div class="notification-popup-title ms-fontSize-l"></div>
                <div class="ms-MessageBanner-content">
                    <div class="ms-MessageBanner-text">
                        <div class="ms-MessageBanner-clipper"></div>
                    </div>
                    <!--<button class="ms-MessageBanner-expand"> <i class="ms-Icon ms-Icon--chevronsDown"></i> </button>-->
                </div>
                <button class="ms-MessageBanner-close"> <i class="ms-Icon ms-Icon--x"></i> </button>
            </div>
        `);

        var css = Utilities.stripSpaces(`
        	/* Notification pane customizations, including overwriting some Fabric UI defaults */

            #notification-popup .notification-popup-title {
                text-align: left;
                margin: 10px 50px 0 15px;
            }
            #notification-popup.ms-MessageBanner {
                position: absolute;
                left: 0px;
                bottom: 0px;
                text-align: left;
                height: inherit;
            }
            #notification-popup.ms-MessageBanner, #notification-popup .ms-MessageBanner-text {
                min-width: inherit;
            }
            #notification-popup .ms-MessageBanner-text {
                margin: 0;
                padding: 18px 15px;
            }
        `);

        var extras = null;

        return new Snippet(meta, ts, html, css, extras);
    }
}
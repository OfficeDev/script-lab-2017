import {Component, OnInit, OnDestroy} from '@angular/core';
import {Location} from '@angular/common';
import {Router, ActivatedRoute} from '@angular/router';
import {Tab, Tabs} from '../shared/components';
import {BaseComponent} from '../shared/components/base.component';
import {ISnippet, Snippet, SnippetManager} from '../shared/services';
import {Utilities} from '../shared/helpers';

@Component({
    selector: 'editor',
    templateUrl: 'editor.component.html',
    styleUrls: ['editor.component.scss'],
    directives: [Tab, Tabs]
})
export class EditorComponent extends BaseComponent implements OnInit, OnDestroy {
    snippet: Snippet;
    status: string;
    error: boolean;
    private timeout;

    constructor(
        private _snippetManager: SnippetManager,
        private _location: Location,
        private _router: Router,
        private _route: ActivatedRoute
    ) {
        super();
        this.snippet = this._createDefaultNewSnippet();
    }

    ngOnInit() {
        var subscription = this._route.params.subscribe(params => {
            var snippetName = Utilities.decode(params['name']);
            try {
                if (!Utilities.isEmpty(snippetName)) {
                    this.snippet = this._snippetManager.findByName(snippetName);
                }
            }
            catch (e) {
                this._showStatus(e, true);
            }
        });

        this.markDispose(subscription);
    }

    change(data: string, property: string) {
        this.snippet[property] = data;
    }

    back() {
        this._location.replaceState('');
        this._router.navigate(['']);
    }

    save() {
        try {
            var snippet = this._snippetManager.saveSnippet(this.snippet);
            this._showStatus('Saved ' + snippet.meta.name);
        }
        catch (e) {
            this._showStatus(e, true);
        }
    }

    delete() {
        try {
            this._snippetManager.deleteSnippet(this.snippet);
            this._showStatus('Deleted ' + this.snippet.meta.name)
                .then(() => {
                    this._location.replaceState('');
                    this._router.navigate(['']);
                });
        }
        catch (e) {
            this._showStatus(e, true);
        }
    }

    duplicate() {
        try {
            var duplicateSnippet = this._snippetManager.duplicateSnippet(this.snippet);
            this._showStatus('Created ' + duplicateSnippet.meta.name).then(() => {
                this._router.navigate(['edit', Utilities.encode(duplicateSnippet.meta.name)]);
            });
        }
        catch (e) {
            this._showStatus(e, true);
        }
    }

    private _showStatus(message: string, error?: boolean) {
        return new Promise((resolve, reject) => {
            try {
                if (!Utilities.isNull(this.timeout)) clearTimeout(this.timeout);
                this.status = message;
                this.error = error;

                this.timeout = setTimeout(() => {
                    clearTimeout(this.timeout);
                    this.status = null;
                    this.error = false;
                    resolve();
                }, 2000);
            }
            catch (exception) {
                reject(exception);
            }
        });
    }

    private _createDefaultNewSnippet(): Snippet {
        var meta = {
            name: null,
            id: null
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
            })
            
            function handleError(error) {
                showNotification("Error", error);
                // Log additional information to the console, if applicable:
                if (error instanceof OfficeExtension.Error) {
                    console.log("Debug info: " + JSON.stringify(error.debugInfo));
                }
            }

            var notificationPopup = createNotificationPopup(document.getElementById('notification-popup'));
            function showNotification(header: string, text: string) {
                notificationPopup.show(header, text);
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

        return new Snippet(<ISnippet>{
            meta: meta,
            ts: ts,
            html: html,
            css: css,
            extras: extras
        });
    }
}
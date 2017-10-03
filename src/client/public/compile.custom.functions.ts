import * as $ from 'jquery';
import { isNil } from 'lodash';
import { UI } from '@microsoft/office-js-helpers';
import { environment, instantiateRibbon } from '../app/helpers';
import { Strings, setDisplayLanguage } from '../app/strings';


interface InitializationParams {
    isRunMode: boolean;
    snippetIframesBase64Texts: Array<string>;
    clientTimestamp: number;
    explicitlySetDisplayLanguageOrNull: string;
}

const CSS_CLASSES = {
    inProgress: 'in-progress',
    error: 'error',
    success: 'success'
};

(() => {
    /** Namespaces for the runner wrapper to share with the inner snippet iframe
     * Note that only listing out Excel-specific ones,
     * since Custom Functions are only for Excel */
    const officeNamespacesForIframe = ['OfficeExtension', 'OfficeCore', 'Excel'];

    let showUI: boolean;

    (window as any).initializeCustomFunctions = (params: InitializationParams): void => {
        try {
            environment.initializePartial({ host: 'EXCEL' });
            showUI = !params.isRunMode; /* show UI for registration, not running invisible snippet */

            if (showUI) {
                instantiateRibbon('ribbon');
            }

            Office.initialize = async () => {
                // Need separate try/catch, since Office.initialize is a callback
                try {
                    // Set initialize to an empty function -- that way, doesn't cause
                    // re-initialization of this page in case of a page like the error dialog,
                    // which doesn't defined (override) Office.initialize.
                    Office.initialize = () => { };

                    await initializeRunnerHelper(params);
                } catch (e) {
                    handleError(e);
                }
            };

        }
        catch (error) {
            handleError(error);
        }
    };

    async function initializeRunnerHelper(initialParams: Partial<InitializationParams>) {
        if (initialParams.explicitlySetDisplayLanguageOrNull) {
            setDisplayLanguage(initialParams.explicitlySetDisplayLanguageOrNull);
            document.cookie = `displayLanguage=${encodeURIComponent(initialParams.explicitlySetDisplayLanguageOrNull)};path=/;`;
        }

        const $snippetNames = showUI ? $('#snippet-names') : null;

        // Begin with clearing out the Excel.Script.CustomFunctions namespace
        // (which is assume to already exist and be initialized in the
        // "custom-functions" runtime helpers)
        (Excel as any).Script.CustomFunctions = {};

        for (let i = 0; i < initialParams.snippetIframesBase64Texts.length; i++) {
            const snippetBase64OrNull = initialParams.snippetIframesBase64Texts[i];
            let $entry = showUI ? $snippetNames.children().eq(i) : null;

            if (isNil(snippetBase64OrNull)) {
                if (showUI) {
                    $entry.addClass(CSS_CLASSES.error);
                }
            } else {
                if (showUI) {
                    $entry.addClass(CSS_CLASSES.inProgress);
                }

                try {
                    await runSnippetCode(atob(initialParams.snippetIframesBase64Texts[i]));
                    if (showUI) {
                        $entry.removeClass(CSS_CLASSES.inProgress).addClass(CSS_CLASSES.success);
                    }
                } catch (e) {
                    // TODO: Think through how to show errors better
                    $entry.removeClass(CSS_CLASSES.inProgress).addClass(CSS_CLASSES.error);
                }
            }
        }

        // TODO what if the below, or any of this, fails when this is invisible?

        // Complete any function registrations
        await Excel.run(async (context) => {
            (context.workbook as any).customFunctions.addAll();
            await context.sync();
        });

        // TODO: establish heartbeat!

        // If in registration (not run) mode, return back to the editor:
        if (!initialParams.isRunMode) {
            window.location.href = `${environment.current.config.editorUrl}/#/edit/EXCEL`;
        }
    }

    function runSnippetCode(html: string): Promise<any> {
        const $iframe =
            $('<iframe class="snippet-frame" style="display:none" src="about:blank"></iframe>');
        $('body').append($iframe);

        const iframe = $iframe[0] as HTMLIFrameElement;
        let { contentWindow } = iframe;

        return new Promise((resolve, reject) => {
            (window as any).scriptRunnerBeginInit = () => {
                contentWindow['Office'] = window['Office'];
                officeNamespacesForIframe.forEach(namespace => {
                    contentWindow[namespace] = window[namespace];
                });
            };

            (window as any).scriptRunnerEndInit = () => {
                // Call Office.initialize(), which now initializes the snippet.
                // The parameter, initializationReason, is not used in the playground.
                Office.initialize(null /*initializationReason*/);
                resolve();
            };

            // Write to the iframe (and note that must do the ".write" call first,
            // before setting any window properties).
            contentWindow.document.open();
            contentWindow.document.write(html);
            contentWindow.onerror = (...args) => {
                console.error(args);
                reject(args); // FIXME, better error handling
            };
            contentWindow.document.close();
        });
    }

    function handleError(error: Error) {
        let candidateErrorString = error.message || error.toString();
        if (candidateErrorString === '[object Object]') {
            candidateErrorString = Strings().unexpectedError;
        }

        UI.notify(error);

        // FIXME: may want a back button of sorts, too...
    }

})();

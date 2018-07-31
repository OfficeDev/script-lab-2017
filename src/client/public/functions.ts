import { Utilities, HostType } from '@microsoft/office-js-helpers';
const { safeExternalUrls } = PLAYGROUND;

const tutorialUrl = `${window.location.origin}/tutorial.html`;
const codeUrl = `${window.location.origin}/?mode=${Utilities.host}`;

function launchInDialog(
  url: string,
  event?: any,
  options?: { width?: number; height?: number; displayInIframe?: boolean }
): void {
  options = options || {};
  options.width = options.width || 60;
  options.height = options.height || 60;
  if (typeof options.displayInIframe === 'undefined') {
    options.displayInIframe = true;
  }
  Office.context.ui.displayDialogAsync(url, options, result => {
    if (Utilities.host === HostType.OUTLOOK) {
      if (result.status === Office.AsyncResultStatus.Failed) {
        event.completed();
      }
      let dialog = result.value as Office.Dialog;
      dialog.addEventHandler(Office.EventType.DialogEventReceived, () => {
        if (event) {
          event.completed();
        }
      });
    }
  });
  if (event && Utilities.host !== HostType.OUTLOOK) {
    event.completed();
  }
}

function launchDialogNavigation(
  url: string,
  event: any,
  options?: { width?: number; height?: number; displayInIframe?: boolean }
): void {
  launchInDialog(
    `${window.location.origin}/external-page.html?destination=${encodeURIComponent(url)}`,
    event,
    options
  );
}

function launchInStandaloneWindow(url: string, event: any): void {
  // At least on desktop, it looks like you can't do "window.open" out of the invisible runner.
  //     Thus, on desktop, still use a dialog API
  // As for Office Online, set displayInIframe as false, so that it prompts a window to
  //     have you open a dialog.  If we did "window.open" directly,
  //     popup blockers would prevent the window from showing.
  //     And conversely, if had "displayInIframe: true" instead, the docs.microsoft.com
  //     site doesn't allow embedding, and get an error.  So it has to be a standalone window,
  //     but created via the Dialog API
  launchDialogNavigation(url, event, { displayInIframe: false });
}

(window as any).commandExecutor = {
  launchCode: event =>
    launchInDialog(codeUrl, event, { width: 75, height: 75, displayInIframe: false }),

  launchTutorial: event => launchInDialog(tutorialUrl, event, { width: 35, height: 45 }),

  launchHelp: event => launchInStandaloneWindow(safeExternalUrls.playground_help, event),

  launchAsk: event => launchInStandaloneWindow(safeExternalUrls.ask, event),

  launchApiDocs: event => {
    if (Office.context.requirements.isSetSupported('ExcelApi')) {
      return launchInStandaloneWindow(safeExternalUrls.excel_api, event);
    } else if (Office.context.requirements.isSetSupported('WordApi')) {
      return launchInStandaloneWindow(safeExternalUrls.word_api, event);
    } else if (Office.context.requirements.isSetSupported('OneNoteApi')) {
      return launchInStandaloneWindow(safeExternalUrls.onenote_api, event);
    } else {
      if (Utilities.host === HostType.POWERPOINT) {
        return launchInStandaloneWindow(safeExternalUrls.powepoint_api, event);
      } else if (Utilities.host === HostType.PROJECT) {
        return launchInStandaloneWindow(safeExternalUrls.project_api, event);
      } else if (Utilities.host === HostType.OUTLOOK) {
        return launchInStandaloneWindow(safeExternalUrls.outlook_api, event);
      } else {
        return launchInStandaloneWindow(safeExternalUrls.generic_api, event);
      }
    }
  },
};

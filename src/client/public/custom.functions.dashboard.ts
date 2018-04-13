import * as moment from 'moment';
import { attempt } from 'lodash';

import { UI } from '@microsoft/office-js-helpers';
import { Strings, getDisplayLanguage } from '../app/strings';
import { environment, navigateToRegisterCustomFunctions, getElapsedTime, getNumberFromLocalStorage, setUpMomentJsDurationDefaults } from '../app/helpers';

const { localStorageKeys } = PLAYGROUND;

const DASHBOARD_REFRESH_INTERVAL = 1000;

const GRID_DOM_SELECTOR = '#grid';
const HOURS_MINUTES_SECOND_FORMAT = 'h:mm:ss a';


interface TransformedLogData {
    timestamp: string;
    source: 'system' | 'user';
    type: string;
    subtype: string;
    message: string;
    severity: 'info' | 'warn' | 'error'
}

class LogGridController {
    constructor(private _entries: TransformedLogData[]) {
        ($(GRID_DOM_SELECTOR) as any).jsGrid({
            width: '100%',
            height: '400px' /* realistically gets overwritten by flex, but needed for jsgrid layout */,
            filtering: true,
            sorting: true,
            autoload: true,
            editing: false,
            paging: false,

            noDataContent: '',

            controller: this,

            fields: [
                // { name: 'type', type: 'text', autosearch: true, width: '120px' },
                // { name: 'subtype', type: 'text', autosearch: true, width: '120px' },
                { name: 'timestamp', type: 'text', autosearch: true, width: '80px' },
                {
                    name: 'source', type: 'select', autosearch: true,
                    items: [''].concat(this.itemEnumerations.sources).map(item => ({ name: item })),
                    valueField: 'name', textField: 'name',
                    widht: '50px'
                },
                { name: 'message', type: 'text', autosearch: true, width: '200px' },

                { type: 'control', width: '50px' }
            ].map(item => ({ ...item, editButton: false, deleteButton: false })),

            rowClass: (entry: TransformedLogData) => entry.severity
        });
    }

    itemEnumerations = {
        sources: ['system', 'user'],
        severity: ['info', 'warn', 'error']
    };

    loadData(filter: TransformedLogData) {
        return $.grep(this._entries, (entry: TransformedLogData) => {
            // TODO: maybe regex?
            const include = (
                (!filter.timestamp || entry.timestamp.toLowerCase().indexOf(filter.timestamp.toLowerCase()) > -1) &&
                (!filter.source || entry.source.toLowerCase().indexOf(filter.source.toLowerCase()) > -1) &&
                (!filter.type || entry.type.toLowerCase().indexOf(filter.type.toLowerCase()) > -1) &&
                (!filter.subtype || entry.subtype.toLowerCase().indexOf(filter.subtype.toLowerCase()) > -1) &&
                (!filter.message || entry.message.toLowerCase().indexOf(filter.message.toLowerCase()) > -1) &&
                (!filter.severity || entry.severity.toLowerCase().indexOf(filter.severity.toLowerCase()) > -1)
            );
            return include;
        });
    }

    insertItem(entry: TransformedLogData) {
        this._entries.push(entry);
    }

    clear() {
        this._entries.splice(0, this._entries.length);
        $(GRID_DOM_SELECTOR).jsGrid('search');
    }
}

(async () => {
    try {
        environment.initializePartial({ host: 'EXCEL' });
        setUpMomentJsDurationDefaults(moment);

        if (!sessionStorage.getItem('hasRegistered')) {
            sessionStorage.setItem('hasRegistered', 'true');
            navigateToRegisterCustomFunctions();
        }

        let starterData = tickAndDequeueLocalStorageData();

        let gridController = new LogGridController(starterData);

        initializeHeader(gridController);

        setTimeout(startPollingLogData, DASHBOARD_REFRESH_INTERVAL);
    }
    catch (error) {
        handleError(error);
    }
})();

function initializeHeader(gridController: LogGridController) {
    $('#clear').click(() => gridController.clear());

    // // Enable when want to debug grid functionality:
    // if (environment.current.devMode) {
    //     $('#add-test-log-item')
    //         .show()
    //         .click(() => {
    //             pushToLogQueue({
    //                 timestamp: new Date().getTime(),
    //                 source: chooseRandomly(gridController.itemEnumerations.sources) as any,
    //                 type: 'TestEntry',
    //                 subtype: chooseRandomly(['subtype1', 'subtype3', 'subtype3']),
    //                 severity: chooseRandomly(gridController.itemEnumerations.severity) as any,
    //                 message: chooseRandomly([
    //                     'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    //                     'Sed auctor ipsum vitae risus vulputate, vel dapibus lacus tristique.',
    //                     'Vivamus accumsan nunc nec ipsum vehicula blandit.',
    //                     'Praesent quis augue ac ex dapibus commodo ac vitae velit.',
    //                     'Nam at eros laoreet, pharetra leo et, sodales elit.',
    //                 ])
    //             });
    //         });
    // }

    $('#register-custom-functions')
        .click(() => {
            let startOfRequestTime = new Date().getTime();
            window.localStorage.setItem(
                localStorageKeys.customFunctionsLastUpdatedCodeTimestamp,
                startOfRequestTime.toString()
            );
            navigateToRegisterCustomFunctions();
        });
}

async function startPollingLogData() {
    try {
        const items = tickAndDequeueLocalStorageData();
        items.forEach(item => {
            $(GRID_DOM_SELECTOR).jsGrid('insertItem', item);
        });

        if (items.length > 0) {
            await new Promise((resolve, reject) => {
                $(GRID_DOM_SELECTOR).jsGrid('search')
                    .then(resolve).fail(reject);
            });

            if ((document.getElementById('scroll-to-bottom') as HTMLInputElement).checked) {
                // Note, for some reason, using the ${GRID_DOM_SELECTOR} prefix in front of the class
                // makes scrollTop not work in IE.  So call it on the global ".jsgrid-grid-body" selector instead
                const $tableBody = $(`.jsgrid-grid-body`);
                $tableBody.scrollTop($tableBody[0].scrollHeight + 1000);
            }
        }

        setTimeout(startPollingLogData, DASHBOARD_REFRESH_INTERVAL);

    }
    catch (error) {
        handleError(error);
    }
}

function tickAndDequeueLocalStorageData(): TransformedLogData[] {
    $('#time').text(moment(new Date()).format(HOURS_MINUTES_SECOND_FORMAT));

    const heartbeatRecentlyAlive = getElapsedTime(getNumberFromLocalStorage(localStorageKeys.customFunctionsLastHeartbeatTimestamp)) < 3000;
    const runnerLastUpdated = moment(new Date(getNumberFromLocalStorage(localStorageKeys.customFunctionsCurrentlyRunningTimestamp)))
        .locale(getDisplayLanguage()).fromNow();
    if (heartbeatRecentlyAlive) {
        $('#status').text(`Live. Runner last updated ${runnerLastUpdated}`).css('color', 'darkgreen');
    } else {
        $('#status').text(`Not running.  Try clicking "Register Custom Functions", and, on success, entering "=ScriptLab.<XYZ>" into the Excel formula bar.`).css('color', 'gray');
    }

    // Note: don't need ensureFreshLocalStorage() here, because the localStorage.setItem above does the equivalent.
    let text = window.localStorage.getItem(localStorageKeys.log) || '';
    if (text.length === 0) {
        return [];
    }

    let results = text.split('\n')
        .filter(item => !(item === null || item.trim().length === 0))
        .map(item => attempt(() => JSON.parse(item) as LogData))
        .map(logDataOrError => {
            if (logDataOrError === null || logDataOrError instanceof Error) {
                let errorReport: LogData = {
                    timestamp: new Date().getTime(),
                    source: 'system',
                    severity: 'error',
                    type: 'uncaught exception',
                    subtype: 'log.ts',
                    message: 'Could not parse the log entry: ' + ((logDataOrError === null) ? '"null"' : logDataOrError.toString())
                };
                return errorReport;
            } else {
                return logDataOrError;
            }
        })
        .map((entry: LogData) => ({
            ...entry,
            timestamp: moment(new Date(entry.timestamp)).format(HOURS_MINUTES_SECOND_FORMAT)
        }));

    window.localStorage.setItem(localStorageKeys.log, '');

    return results;
}

function handleError(error: Error) {
    let candidateErrorString = error.message || error.toString();
    if (candidateErrorString === '[object Object]') {
        candidateErrorString = Strings().unexpectedError;
    }

    if (error instanceof Error) {
        UI.notify(error);
    } else {
        UI.notify(Strings().error, candidateErrorString);
    }
}

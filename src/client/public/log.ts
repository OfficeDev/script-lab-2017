import * as moment from 'moment';
import { UI } from '@microsoft/office-js-helpers';
import { Strings } from '../app/strings';
import { environment, pushToLogQueue, chooseRandomly } from '../app/helpers';


const { localStorageKeys } = PLAYGROUND;

const GRID_DOM_SELECTOR = '#grid';
const READ_INTERVAL = 1000;

interface TransformedLogData {
    timestamp: string;
    source: 'system' | 'user';
    type: string;
    subtype: string;
    message: string;
    severity: 'info' | 'warn' | 'error'
}

class LogGridController {
    entries: TransformedLogData[];

    itemEnumerations = {
        sources: ['system', 'user'],
        severity: ['info', 'warn', 'error']
    };

    loadData(filter: TransformedLogData) {
        return $.grep(this.entries, (entry: TransformedLogData) => {
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
        this.entries.push(entry);
    }
}

(async () => {
    try {
        environment.initializePartial();

        let gridControllerInstance = new LogGridController();

        let starterData = dequeueLocalStorageLogData();
        gridControllerInstance.entries = starterData;

        if (environment.current.devMode && starterData.length === 0) {
            setInterval(() => {
                pushToLogQueue({
                    timestamp: new Date().getTime(),
                    source: chooseRandomly(gridControllerInstance.itemEnumerations.sources) as any,
                    type: 'TestEntry',
                    subtype: chooseRandomly(['subtype1', 'subtype3', 'subtype3']),
                    severity: chooseRandomly(gridControllerInstance.itemEnumerations.severity) as any,
                    message: chooseRandomly([
                        'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
                        'Sed auctor ipsum vitae risus vulputate, vel dapibus lacus tristique.',
                        'Vivamus accumsan nunc nec ipsum vehicula blandit.',
                        'Praesent quis augue ac ex dapibus commodo ac vitae velit.',
                        'Nam at eros laoreet, pharetra leo et, sodales elit.',
                    ])
                });
            }, 1000);
        }

        createGrid(GRID_DOM_SELECTOR, gridControllerInstance);

        setTimeout(startPollingLogData, READ_INTERVAL);
    }
    catch (error) {
        handleError(error);
    }
})();

function createGrid(selector: string, controller: LogGridController) {
    ($(selector) as any).jsGrid({
        height: '700px',
        filtering: true,
        sorting: true,
        autoload: true,
        editing: false,
        paging: false,

        controller,

        fields: [
            { name: 'timestamp', type: 'text', autosearch: true },
            { name: 'source', type: 'select', autosearch: true, items: [''].concat(controller.itemEnumerations.sources).map(item => ({ name: item })), valueField: 'name', textField: 'name' },
            { name: 'type', type: 'text', autosearch: true },
            { name: 'subtype', type: 'text', autosearch: true },
            { name: 'message', type: 'text', autosearch: true },
            { name: 'severity', type: 'select', autosearch: true, items: [''].concat(controller.itemEnumerations.severity).map(item => ({ name: item })), valueField: 'name', textField: 'name' },
            { type: 'control' }
        ].map(item => ({ ...item, editButton: false, deleteButton: false }))
    });
}

function startPollingLogData() {
    try {
        const $tableBody = $(`${GRID_DOM_SELECTOR} .jsgrid-grid-body`);
        let isScrolledAllTheWayToBottom = ($tableBody.scrollTop() + $tableBody.innerHeight() >= $tableBody[0].scrollHeight);

        dequeueLocalStorageLogData().forEach(item => {
            $(GRID_DOM_SELECTOR).jsGrid('insertItem', item);
        });

        $(GRID_DOM_SELECTOR).jsGrid('search').then(() => {
            if (isScrolledAllTheWayToBottom) {
                $tableBody.scrollTop(Number.MAX_SAFE_INTEGER);
            }

            setTimeout(startPollingLogData, READ_INTERVAL);
        }).fail(handleError);
    }
    catch (error) {
        handleError(error);
    }
}

function dequeueLocalStorageLogData(): TransformedLogData[] {
    // Due to bug in IE (https://stackoverflow.com/a/40770399),
    // Local Storage may get out of sync across tabs.  To fix this,
    // set a value of some key, and this will ensure that localStorage is refreshed.
    window.localStorage.setItem(localStorageKeys.dummyUnusedKey, null);

    let text = window.localStorage.getItem(localStorageKeys.log) || '';
    if (text.length === 0) {
        return [];
    }

    let results = text.split('\n')
        .map(item => JSON.parse(item) as LogData)
        .map(entry => ({
            ...entry,
            timestamp: moment(new Date(entry.timestamp)).format('hh:mm:ss a')
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

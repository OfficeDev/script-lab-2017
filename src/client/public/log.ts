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
    constructor(private _entries: TransformedLogData[]) {
        ($(GRID_DOM_SELECTOR) as any).jsGrid({
            width: '100%',
            height: '400px' /* realistically gets overwritten by flex, but needed for jsgrid layout */,
            filtering: true,
            sorting: true,
            autoload: true,
            editing: false,
            paging: false,

            controller: this,

            fields: [
                { name: 'timestamp', type: 'text', autosearch: true, width: '100px' },
                {
                    name: 'source', type: 'select', autosearch: true,
                    items: [''].concat(this.itemEnumerations.sources).map(item => ({ name: item })),
                    valueField: 'name', textField: 'name',
                    widht: '70px'
                },
                { name: 'type', type: 'text', autosearch: true, width: '80px'},
                { name: 'subtype', type: 'text', autosearch: true, width: '100px' },
                { name: 'message', type: 'text', autosearch: true, width: 'auto' },
                {
                    name: 'severity', type: 'select', autosearch: true,
                    items: [''].concat(this.itemEnumerations.severity).map(item => ({ name: item })),
                    valueField: 'name', textField: 'name',
                    width: '80px'
                },
                { type: 'control' }
            ].map(item => ({ ...item, editButton: false, deleteButton: false }))
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
        environment.initializePartial();

        let starterData = dequeueLocalStorageLogData();

        let gridController = new LogGridController(starterData);

        initializeHeader(gridController);

        setTimeout(startPollingLogData, READ_INTERVAL);
    }
    catch (error) {
        handleError(error);
    }
})();

function initializeHeader(gridController: LogGridController) {
    $('#clear').click(() => gridController.clear());

    // Enable when want to debug grid functionality:
    if (environment.current.devMode) {
        $('#add-test-log-item')
            .show()
            .click(() => {
                pushToLogQueue({
                    timestamp: new Date().getTime(),
                    source: chooseRandomly(gridController.itemEnumerations.sources) as any,
                    type: 'TestEntry',
                    subtype: chooseRandomly(['subtype1', 'subtype3', 'subtype3']),
                    severity: chooseRandomly(gridController.itemEnumerations.severity) as any,
                    message: chooseRandomly([
                        'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
                        'Sed auctor ipsum vitae risus vulputate, vel dapibus lacus tristique.',
                        'Vivamus accumsan nunc nec ipsum vehicula blandit.',
                        'Praesent quis augue ac ex dapibus commodo ac vitae velit.',
                        'Nam at eros laoreet, pharetra leo et, sodales elit.',
                    ])
                });
            });
    }
}

async function startPollingLogData() {
    try {
        const items = dequeueLocalStorageLogData();
        items.forEach(item => {
            $(GRID_DOM_SELECTOR).jsGrid('insertItem', item);
        });

        if (items.length > 0) {
            await new Promise((resolve, reject) => {
                $(GRID_DOM_SELECTOR).jsGrid('search')
                    .then(resolve).fail(reject);
            });

            if ((document.getElementById('scroll-to-bottom') as HTMLInputElement).checked) {
                const $tableBody = $(`${GRID_DOM_SELECTOR} .jsgrid-grid-body`);
                $tableBody.scrollTop(Number.MAX_SAFE_INTEGER);
            }
        }

        setTimeout(startPollingLogData, READ_INTERVAL);

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

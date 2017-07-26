import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import * as cors from 'cors';
import * as Request from 'request';
import * as Archiver from 'archiver';
import { isString, forIn, isNil } from 'lodash';
import { replaceTabsWithSpaces, clipText } from './core/utilities';
import { BadRequestError, UnauthorizedError, InformationalError } from './core/errors';
import { Strings, ServerStrings, getExplicitlySetDisplayLanguageOrNull } from './strings';
import { loadTemplate } from './core/template.generator';
import { SnippetGenerator } from './core/snippet.generator';
import { ApplicationInsights } from './core/ai.helper';
import { getShareableYaml } from './core/snippet.helper';
import {
    IErrorHandlebarsContext, IManifestHandlebarsContext, IReadmeHandlebarsContext,
    IRunnerHandlebarsContext, ISnippetHandlebarsContext
} from './interfaces';

const moment = require('moment');
const uuidV4 = require('uuid/v4');

const { build, config, secrets } = require('./core/env.config.js');
const env = process.env.PG_ENV || 'local';
const currentConfig = config[env] as IEnvironmentConfig;
const ai = new ApplicationInsights(currentConfig.instrumentationKey);
const app = express();


// Note: a similar mapping exists in the client Utilities as well:
// src/client/app/helpers/utilities.ts
const officeHosts = ['ACCESS', 'EXCEL', 'ONENOTE', 'OUTLOOK', 'POWERPOINT', 'PROJECT', 'WORD'];
const otherValidHosts = ['WEB'];
const officeHostToManifestTypeMap = {
    'EXCEL': 'Workbook',
    'WORD': 'Document',
    'POWERPOINT': 'Presentation',
    'PROJECT': 'Project'
};
function supportsAddinCommands(host: string) {
    return host === 'EXCEL' || host === 'WORD' || host === 'POWERPOINT';
}
function isOfficeHost(host: string) {
    return officeHosts.indexOf(host) >= 0;
}

let assetPaths;
function getAssetPaths(): { [key: string]: string } {
    if (!assetPaths) {
        let data = fs.readFileSync(path.resolve(__dirname, 'assets.json'));
        assetPaths = JSON.parse(data.toString());
    }

    return assetPaths;
}

/**
 * Server CERT and PORT configuration
 */
if (process.env.NODE_ENV === 'production') {
    app.listen(process.env.port || 1337, () => console.log(`Script Lab Runner listening on port ${process.env.PORT}`));
}
else {
    const cert = {
        key: fs.readFileSync(path.resolve('node_modules/browser-sync/lib/server/certs/server.key')),
        cert: fs.readFileSync(path.resolve('node_modules/browser-sync/lib/server/certs/server.crt'))
    };
    https.createServer(cert, app).listen(3200, () => console.log('Playground server running on 3200'));
}

app.use(cookieParser());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(cors());
app.use('/favicon', express.static('favicon'));


/**
 * HTTP GET: /run
 * Returns a runner page, with the following parameters:
 * Required:
 *   - host
 *   - id
 *
 * Optional query parameters:
 *   - officeJS: Office.js reference (to allow switching between prod and beta, minified vs release)
 *               If not specified, default production Office.js will be assumed for Office snippets.
 */
registerRoute('get', '/run/:host/:id', (req, res) => {
    const host = (req.params.host as string).toUpperCase();
    const id = (req.params.id as string || '').toLowerCase();
    const strings = Strings(req);

    if (officeHosts.indexOf(host) < 0 && otherValidHosts.indexOf(host) < 0) {
        throw new BadRequestError(`${strings.invalidHost} "${host}"`);
    }
    if (isNil(id)) {
        throw new BadRequestError(`${strings.invalidId} "${id}"`);
    }

    // NOTE: using Promise-based code instead of async/await
    // to avoid unhandled exception-pausing on debugging.
    return loadTemplate<IRunnerHandlebarsContext>('runner')
        .then(runnerHtmlGenerator => {
            const html = runnerHtmlGenerator({
                snippet: {
                    id: id
                },
                officeJS: determineOfficeJS(req.query, host),
                returnUrl: '',
                origin: currentConfig.editorUrl,
                host: host,
                assets: getAssetPaths(),
                initialLoadSubtitle: strings.loadingSnippetDotDotDot,
                headerTitle: '',
                strings,
                explicitlySetDisplayLanguageOrNull: getExplicitlySetDisplayLanguageOrNull(req)
            });

            res.setHeader('Cache-Control', 'no-cache, no-store');
            return res.contentType('text/html').status(200).send(html);
        });

    /**
     * Helper function to return the OfficeJS URL (from query parameter,
     * or from guessing based on host), or empty string
     **/
    function determineOfficeJS(query: any, host: string): string {
        const queryParamsLowercase: { officejs: string } = <any>{};
        forIn(query as { [key: string]: string },
            (value, key) => queryParamsLowercase[key.toLowerCase()] = value);

        if (queryParamsLowercase.officejs && queryParamsLowercase.officejs.trim() !== '') {
            return queryParamsLowercase.officejs.trim();
        }

        if (isOfficeHost(host.toUpperCase())) {
            // Assume a production Office.js for the Office products --
            // and worse case (e.g., if targeting Beta, or debug version),
            // the runner will just force a refresh after the page has loaded
            return 'https://appsforoffice.microsoft.com/lib/1/hosted/office.js';
        }

        return '';
    }
});


/**
 * HTTP POST: /auth
 * Returns the access_token
 */
registerRoute('post', '/auth/:user', (req, res) => {
    const { code, state } = req.body;
    const { user } = req.params;
    const strings = Strings(req);

    if (code == null) {
        throw new BadRequestError(strings.receivedInvalidAuthCode, code);
    }

    const { clientId, editorUrl } = currentConfig;
    const timer = ai.trackTimedEvent('[Runner] GitHub Authentication');

    // NOTE: using Promise-based code instead of async/await
    // to avoid unhandled exception-pausing on debugging.
    return new Promise((resolve, reject) => {
        return Request.post({
            url: 'https://github.com/login/oauth/access_token',
            headers: {
                'Accept': 'application/json'
            },
            json: {
                client_id: clientId,
                client_secret: secrets ? secrets[env] : '',
                redirect_uri: editorUrl,
                code,
                state
            }
        }, (error, httpResponse, body) => {
            timer.stop();
            if (error) {
                ai.trackEvent('[Github] Login failed', { user });
                return reject(new UnauthorizedError(strings.failedToAuthenticateUser, error));
            }
            else {
                ai.trackEvent('[Github] Login succeeded', { user });
                return resolve(body);
            }
        });
    })
        .then(token => res.contentType('application/json').status(200).send(token));
});


/**
 * HTTP POST: /compile/snippet
 * Returns the compiled snippet only (no outer runner chrome)
 */
registerRoute('post', '/compile/snippet', compileCommon);


/**
 * HTTP POST: /compile/page
 * Returns the entire page (with runner chrome) of the compiled snippet
 */
registerRoute('post', '/compile/page', (req, res) => compileCommon(req, res, true /*wrapWithRunnerChrome*/));

registerRoute('post', '/export', (req, res) => {
    const data: IExportState = JSON.parse(req.body.data);
    const { snippet, additionalFields, sanitizedFilenameBase } = data;
    const strings = Strings(req);

    const filenames = {
        html: sanitizedFilenameBase + '.html',
        yaml: sanitizedFilenameBase + '--snippet-data.yaml',
        manifest: sanitizedFilenameBase + '--manifest.xml',
        readme: 'README.md'
    };

    // NOTE: using Promise-based code instead of async/await
    // to avoid unhandled exception-pausing on debugging.
    return Promise.all([
        generateSnippetHtmlData(snippet, true /*isExternalExport*/, strings),
        generateReadme(snippet),
        isOfficeHost(snippet.host) ?
            generateManifest(snippet, additionalFields, filenames.html, strings) : null
    ])
        .then(results => {
            const htmlData: { html: string, officeJS: string } = results[0];
            const readme = results[1];
            const manifestIfAny: string = results[2];

            res.set('Content-Type', 'application/zip');

            const zip = Archiver('zip')
                .append(htmlData.html, { name: filenames.html })
                .append(getShareableYaml(snippet, additionalFields), { name: filenames.yaml })
                .append(readme, { name: filenames.readme });

            if (manifestIfAny) {
                zip.append(manifestIfAny, { name: filenames.manifest });
            }

            zip.finalize();
            zip.pipe(res);
        });
});


/** HTTP GET: Gets runner version info (useful for debugging, to match with the info in the Editor "about" view) */
registerRoute('get', '/', (req, res) => {
    const strings = Strings(req);
    throw new InformationalError(
        strings.scriptLabRunner,
        strings.getGoBackToEditor(currentConfig.editorUrl));
});

/** HTTP GET: Gets runner version info (useful for debugging, to match with the info in the Editor "about" view) */
registerRoute('get', '/version', (req, res) => {
    const strings = Strings(req);
    throw new InformationalError(
        strings.versionInfo,
        JSON.stringify({
            build: build,
            editorUrl: currentConfig.editorUrl,
            runnerUrl: currentConfig.runnerUrl,
            samplesUrl: currentConfig.samplesUrl
        }, null, 4)
    );
});


// HELPERS

function compileCommon(req: express.Request, res: express.Response, wrapWithRunnerChrome?: boolean) {
    const data: IRunnerState = JSON.parse(req.body.data);
    const { snippet, returnUrl } = data;
    const strings = Strings(req);

    // Note: need the return URL explicitly, so can know exactly where to return to (editor vs. gallery view),
    // and so that refresh page could know where to return to if the snippet weren't found.

    const timer = ai.trackTimedEvent('[Runner] Compile Snippet', { id: snippet.id });

    // NOTE: using Promise-based code instead of async/await
    // to avoid unhandled exception-pausing on debugging.
    return Promise.all([
        generateSnippetHtmlData(snippet, false /*isExternalExport*/, strings),
        wrapWithRunnerChrome ? loadTemplate<IRunnerHandlebarsContext>('runner') : null,
    ])
        .then(values => {
            const snippetHtmlData: { html: string, officeJS: string } = values[0];
            const runnerHtmlGenerator: (context: IRunnerHandlebarsContext) => string = values[1];

            let html = snippetHtmlData.html;

            if (wrapWithRunnerChrome) {
                html = runnerHtmlGenerator({
                    snippet: {
                        id: snippet.id,
                        lastModified: snippet.modified_at,
                        content: html
                    },
                    officeJS: snippetHtmlData.officeJS,
                    returnUrl: returnUrl,
                    origin: snippet.origin,
                    host: snippet.host,
                    assets: getAssetPaths(),
                    initialLoadSubtitle: strings.getLoadingSnippetSubtitle(snippet.name),
                    headerTitle: snippet.name,
                    strings,
                    explicitlySetDisplayLanguageOrNull: getExplicitlySetDisplayLanguageOrNull(req)
                });
            }

            timer.stop();
            res.setHeader('Cache-Control', 'no-cache, no-store');
            res.contentType('text/html').status(200).send(replaceTabsWithSpaces(html));
        });
}

function generateSnippetHtmlData(
    snippet: ISnippet,
    isExternalExport: boolean,
    strings: ServerStrings
): Promise<{ html: string, officeJS: string }> {

    if (snippet == null) {
        throw new BadRequestError(strings.receivedInvalidSnippetData, null /*details*/);
    }

    // NOTE: using Promise-based code instead of async/await
    // to avoid unhandled exception-pausing on debugging.
    const snippetGenerator = new SnippetGenerator(strings);

    return snippetGenerator.compile(snippet).catch(e => e)
        .then(async (compiledSnippetOrError: ICompiledSnippet | Error) => {
            let officeJS = '';
            let html: string;

            if (compiledSnippetOrError instanceof Error) {
                ai.trackException(compiledSnippetOrError, 'Server - Compile error');
                html = await generateErrorHtml(compiledSnippetOrError, strings);
            } else {
                const snippetHandlebarsContext: ISnippetHandlebarsContext = {
                    ...compiledSnippetOrError,
                    isOfficeSnippet: isOfficeHost(snippet.host),
                    isExternalExport: isExternalExport,
                    strings
                };

                const snippetHtmlGenerator = await loadTemplate<ISnippetHandlebarsContext>('snippet');
                html = snippetHtmlGenerator(snippetHandlebarsContext);
                officeJS = (compiledSnippetOrError as ICompiledSnippet).officeJS;
            }

            return { html, officeJS };
        });
}

async function generateManifest(
    snippet: ISnippet,
    additionalFields: ISnippet,
    htmlFilename: string,
    strings: ServerStrings
): Promise<string> {

    const manifestGenerator = await loadTemplate<IManifestHandlebarsContext>('manifest');

    const hostType = officeHostToManifestTypeMap[snippet.host];
    if (!hostType) {
        // OK to be English-only, internal error that should never happen.
        throw new BadRequestError(`Cannot find matching Office host type for snippet host "${snippet.host}"`);
    }

    const snippetNameMax125 = clipText(snippet.name, 125) || strings.manifestDefaults.nameIfEmpty;
    const snippetDescriptionMax250 = clipText(snippet.description, 250) || strings.manifestDefaults.descriptionIfEmpty;

    return manifestGenerator({
        name: snippetNameMax125,
        description: snippetDescriptionMax250,
        snippetNameMax125,
        snippetDescriptionMax250,
        htmlFilename,
        providerName: snippet.author || additionalFields.author || strings.createdWithScriptLab,
        hostType,
        supportsAddinCommands: supportsAddinCommands(snippet.host),
        guid: uuidV4()
    });
}

async function generateReadme(snippet: ISnippet): Promise<string> {
    // Keeping README as English-only, too many strings in that page to localize otherwise

    const readmeGenerator = await loadTemplate<IReadmeHandlebarsContext>('readme');
    const isAddin = isOfficeHost(snippet.host);

    return readmeGenerator({
        name: snippet.name,
        description: snippet.description,
        exportedOn: moment().format('dddd, MMMM Do YYYY, h:mm:ss a'),
        isAddin,
        addinOrWebpage: isAddin ? 'Add-in' : 'webpage',
    });
}


////////////////////////////////////////////////////////////////
// Helper functions for registering routes and handling errors:
////////////////////////////////////////////////////////////////

function registerRoute(
    verb: 'get' | 'post',
    path: string | string[],
    action: (req: express.Request, res: express.Response) => Promise<any>
) {
    app[verb](path, (async (req: express.Request, res: express.Response) => {
        try {
            return await action(req, res);
        } catch (e) {
            const strings = Strings(req);
            return await errorHandler(res, e, strings);
        }
    }));
}

async function errorHandler(res: express.Response, error: Error, strings: ServerStrings) {
    if (!(error instanceof InformationalError)) {
        ai.trackException(error, 'Server - Per-route handler');
    }

    const html = await generateErrorHtml(error, strings);
    res.setHeader('Cache-Control', 'no-cache, no-store');
    return res.contentType('text/html').status(200).send(html);
}

async function generateErrorHtml(error: Error, strings: ServerStrings): Promise<string> {
    const errorHtmlGenerator = await loadTemplate<IErrorHandlebarsContext>('error');

    const title = error instanceof InformationalError ? error.message : strings.error;
    let message;
    let expandDetailsByDefault: boolean;
    let details: string;

    if (isString(error)) {
        message = error;
        // And don't set details to anything -- as there is nothing to expand upon.
    } else {
        message = error.message || error.toString();
        if (message === '[object Object]') {
            message = strings.unexpectedError;
        }

        const hasDetails =
            (error instanceof BadRequestError || error instanceof InformationalError)
            && error.details != null;

        if (hasDetails) {
            details = (error as BadRequestError | InformationalError).details;
            expandDetailsByDefault = true;
        } else {
            details = JSON.stringify(error, null, 4);
        }

        if (error instanceof InformationalError) {
            // Title will already contain the message.  So set actual message to null
            message = null;
        }
    }

    return errorHtmlGenerator({
        origin: currentConfig.editorUrl,
        assets: getAssetPaths(),
        title,
        message,
        details,
        expandDetailsByDefault
    });
}

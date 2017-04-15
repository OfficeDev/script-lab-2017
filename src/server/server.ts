import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import * as Request from 'request';
import { isString, forIn, isNil } from 'lodash';
import { replaceTabsWithSpaces } from './core/utilities';
import { BadRequestError, UnauthorizedError } from './core/errors';
import { Strings } from './core/strings';
import { loadTemplate } from './core/template.generator';
import { snippetGenerator } from './core/snippet.generator';
import { ApplicationInsights } from './core/ai.helper';

const { build, config, secrets } = require('./core/env.config.js');
const env = process.env.PG_ENV || 'local';
const currentConfig = config[env] as IEnvironmentConfig;
const ai = new ApplicationInsights(currentConfig.instrumentationKey);
const app = express();

const officeHosts = ['ACCESS', 'EXCEL', 'ONENOTE', 'OUTLOOK', 'POWERPOINT', 'PROJECT', 'WORD'];
const otherValidHosts = ['WEB'];


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

    if (officeHosts.indexOf(host) < 0 && otherValidHosts.indexOf(host) < 0) {
        throw new BadRequestError(`Invalid host "${host}"`);
    }
    if (isNil(id)) {
        throw new BadRequestError(`Invalid id "${id}"`);
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
                initialLoadSubtitle: 'Loading snippet...',
                headerTitle: ''
            });

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

        if (officeHosts.indexOf(host.toUpperCase()) >= 0) {
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

    if (code == null) {
        throw new BadRequestError('Received invalid code.', code);
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
                return reject(new UnauthorizedError('Failed to authenticate user.', error));
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


/** HTTP GET: Gets runner version info (useful for debugging, to match with the info in the Editor "about" view) */
registerRoute('get', '/version', (req, res) => {
    throw new BadRequestError('Version information', JSON.stringify(build, null, 4));
});


// HELPERS

function compileCommon(req: express.Request, res: express.Response, wrapWithRunnerChrome?: boolean) {
    const data: IRunnerState = JSON.parse(req.body.data);
    const { snippet, returnUrl } = data;

    // Note: need the return URL explicitly, so can know exactly where to return to (editor vs. gallery view),
    // and so that refresh page could know where to return to if the snippet weren't found.

    if (snippet == null) {
        throw new BadRequestError('Received invalid snippet data.', null /*details*/, snippet);
    }

    const timer = ai.trackTimedEvent('[Runner] Compile Snippet', { id: snippet.id });

    // NOTE: using Promise-based code instead of async/await
    // to avoid unhandled exception-pausing on debugging.
    return Promise.all([
        snippetGenerator.compile(snippet).catch(e => e),
        loadTemplate<ICompiledSnippet>('snippet'),
        wrapWithRunnerChrome ? loadTemplate<IRunnerHandlebarsContext>('runner') : null,
    ])
        .then(async templates => {
            const [compiledSnippetOrError, snippetHtmlGenerator, runnerHtmlGenerator] = templates;

            let officeJS = '';
            let html: string;


            if (compiledSnippetOrError instanceof Error) {
                ai.trackException(compiledSnippetOrError, 'Server - Compile error');
                html = await generateErrorHtml(compiledSnippetOrError);

            } else {
                html = snippetHtmlGenerator(compiledSnippetOrError);
                officeJS = (compiledSnippetOrError as ICompiledSnippet).officeJS;
            }

            if (wrapWithRunnerChrome) {
                html = runnerHtmlGenerator({
                    snippet: {
                        id: snippet.id,
                        lastModified: snippet.modified_at,
                        content: html
                    },
                    officeJS,
                    returnUrl: returnUrl,
                    origin: snippet.origin,
                    host: snippet.host,
                    initialLoadSubtitle: Strings.getLoadingSnippetSubtitle(snippet.name),
                    headerTitle: snippet.name
                });
            }

            timer.stop();

            res.contentType('text/html').status(200).send(replaceTabsWithSpaces(html));
        });
}



////////////////////////////////////////////////////////////////
// Helper functions for registering routes and handling errors:
////////////////////////////////////////////////////////////////

function registerRoute(
    verb: 'get'|'post',
    path: string|string[],
    action: (req: express.Request, res: express.Response) => Promise<any>
) {
    app[verb](path, (async (req: express.Request, res: express.Response) => {
        try {
            return await action(req, res);
        } catch (e) {
            return await errorHandler(res, e);
        }
    }));
}

async function errorHandler(res: express.Response, error: Error) {
    ai.trackException(error, 'Server - Per-route handler');
    const html = await generateErrorHtml(error);
    return res.contentType('text/html').status(200).send(html);
}

async function generateErrorHtml(error: Error): Promise<string> {
    const errorHtmlGenerator = await loadTemplate<IErrorHandlebarsContext>('error');

    let message;
    let expandDetailsByDefault: boolean;
    let details: string;

    if (isString(error)) {
        message = error;
        // And don't set details to anything -- as there is nothing to expand upon.
    } else {
        message = error.message || error.toString();
        if (message === '[object Object]') {
            message = Strings.unexpectedError;
        }

        if (error instanceof BadRequestError && error.details != null) {
            details = error.details;

            /** Will be useful details to see, if explicitly specified on the BadRequestContext */
            expandDetailsByDefault = true;
        } else {
            details = JSON.stringify(error, null, 4);
        }
    }

    return errorHtmlGenerator({
        origin: currentConfig.editorUrl,
        message,
        details,
        expandDetailsByDefault
    });
}

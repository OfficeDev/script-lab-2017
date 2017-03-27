import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import * as Request from 'request';
import { forIn } from 'lodash';
import { replaceTabsWithSpaces } from './core/utilities';
import { BadRequestError, UnauthorizedError } from './core/errors';
import { loadTemplate } from './core/template.generator';
import { snippetGenerator } from './core/snippet.generator';
import { ApplicationInsights } from './core/ai.helper';

const { config, secrets } = require('./core/env.config.js');
const env = process.env.PG_ENV || 'local';
const currentConfig = config[env] as IEnvironmentConfig;
const ai = new ApplicationInsights(currentConfig.instrumentationKey);
const handler = callback => (...args) => callback(...args).catch(args[2] /* pass the error as the 'next' param */);
const app = express();

const officeHosts = ['ACCESS', 'EXCEL', 'ONENOTE', 'OUTLOOK', 'POWERPOINT', 'PROJECT', 'WORD'];
const otherValidHosts = ['WEB'];


/**
 * Server CERT and PORT configuration
 */
if (process.env.NODE_ENV === 'production') {
    app.listen(process.env.port || 1337, () => console.log(`Project Bornholm Runner listening on port ${process.env.PORT}`));
}
else {
    const cert = {
        key: fs.readFileSync(path.resolve('node_modules/browser-sync/lib/server/certs/server.key')),
        cert: fs.readFileSync(path.resolve('node_modules/browser-sync/lib/server/certs/server.crt'))
    };
    https.createServer(cert, app).listen(3200, () => console.log('Playground server running on 3200'));
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use('/favicon', express.static('favicon'));

/**
 * Generic exception handler
 */
app.use((err, req, res, next) => {
    if (err) {
        const { code, stack, message } = err;
        ai.trackException(err, 'Server - Global handler');
        return res.contentType('application/json').send({ code, message, stack });
    }
});


/**
 * HTTP GET: /run
 * Returns a runner page, parameters for:
 * Required:
 *   - host
 *   - id
 * And also the following optional query parameter:
 *   - officeJS: Office.js reference (to allow switching between prod and beta, minified vs release)
 *               If not specified, default production Office.js will be assumed for Office snippets.
 */
app.get('/run/:host/:id', handler(async (req: express.Request, res: express.Response) => {
    const host = (req.params.host as string).toUpperCase();

    if (officeHosts.indexOf(host) < 0 && otherValidHosts.indexOf(host) < 0) {
        return new BadRequestError(`Invalid host "${host}"`);
    }

    const id = (req.params.id as string).toLowerCase() || '';
    if (!id) {
        return new BadRequestError('Snippet id is a required parameters for "run"');
    }

    const runnerHtmlGenerator = await loadTemplate<IRunnerHandlebarsContext>('runner');
    const html = runnerHtmlGenerator({
        snippetContent: '',
        officeJS: determineOfficeJS(req.query, host),
        snippetId: id,
        snippetLastModified: 0,
        returnUrl: '',
        origin: currentConfig.editorUrl,
        host: host,
        initialLoadSubtitle: 'Loading snippet...',
        headerTitle: 'Loading snippet...'
    });

    return res.contentType('text/html').status(200).send(html);
}));
/**
 * HTTP POST: /auth
 * Returns the access_token
 */
app.post('/auth/:user', handler(async (req: express.Request, res: express.Response) => {
    const { code, state } = req.body;
    const { user } = req.params;

    if (code == null) {
        return new BadRequestError('Received invalid code.', code);
    }

    const { clientId, editorUrl } = currentConfig;
    const timer = ai.trackTimedEvent('[Runner] GitHub Authentication');
    const token = await new Promise((resolve, reject) => {
        return Request.post({
            url: 'https://github.com/login/oauth/access_token',
            headers: {
                'Accept': 'application/json'
            },
            json: {
                client_id: clientId,
                client_secret: secrets[env],
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
    });

    return res.contentType('application/json').status(200).send(token);
}));

/**
 * HTTP POST: /compile/snippet
 * Returns the compiled snippet only (no outer runner chrome)
 */
app.post('/compile/snippet', handler(async (req: express.Request, res: express.Response) => {
    const response = await compileCommon(req);
    return res.contentType('text/html').status(200).send(response);
}));

/**
 * HTTP POST: /compile/page
 * Returns the entire page (with runner chrome) of the compiled snippet
 */
app.post('/compile/page', handler(async (req: express.Request, res: express.Response) => {
    const response = await compileCommon(req, true /*wrapWithRunnerChrome*/);
    return res.contentType('text/html').status(200).send(response);
}));


// HELPERS

async function compileCommon(req: express.Request, wrapWithRunnerChrome?: boolean): Promise<string> {
    const data: IRunnerState = JSON.parse(req.body.data);
    const { snippet, returnUrl } = data;

    // Note: need the return URL explicitly, so can know exactly where to return to (editor vs. gallery view),
    // and so that refresh page could know where to return to if the snippet weren't found.

    if (snippet == null) {
        throw new BadRequestError('Received invalid snippet data.', snippet);
    }

    const timer = ai.trackTimedEvent('[Runner] Compile Snippet', { id: snippet.id });

    const [compiledSnippet, snippetHtml, runnerHtml] =
        await Promise.all([
            snippetGenerator.compile(snippet),
            loadTemplate<ICompiledSnippet>('snippet'),
            wrapWithRunnerChrome ? loadTemplate<IRunnerHandlebarsContext>('runner') : null,
        ]);

    let html = snippetHtml(compiledSnippet);

    if (wrapWithRunnerChrome) {
        html = runnerHtml({
            snippetContent: html,
            officeJS: compiledSnippet.officeJS,
            snippetId: snippet.id,
            snippetLastModified: snippet.modified_at,
            returnUrl: returnUrl,
            origin: snippet.origin,
            host: snippet.host,
            initialLoadSubtitle: `Loading "${snippet.name}"`,
            headerTitle: snippet.name
        });
    }

    timer.stop();
    return replaceTabsWithSpaces(html);
}

/** return the OfficeJS URL (from query parameter, or from guessing based on host), or empty string */
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

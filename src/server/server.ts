import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import * as Request from 'request';
import { replaceTabsWithSpaces, generateUrl } from './core/utilities';
import { BadRequestError, UnauthorizedError } from './core/errors';
import { loadTemplate } from './core/template.generator';
import { snippetGenerator } from './core/snippet.generator';
import { ApplicationInsights } from './core/ai.helper';

const { config, secrets } = require('./core/env.config.js');
const env = process.env.PG_ENV || 'local';
const source = config[env] as IEnvironmentConfig;
const ai = new ApplicationInsights(source.instrumentationKey);

const handler = callback => (...args) => callback(...args).catch(args[2] /* pass the error as the 'next' param */);

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use('/favicon', express.static('favicon'));

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

    if (source == null) {
        return new BadRequestError(`Bad environment configuration: ${env}`, env);
    }

    let { clientId, editorUrl } = source;
    let timer = ai.trackTimedEvent('[Runner] GitHub Authentication');
    let token = await new Promise((resolve, reject) => {
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

/**
 * Generic exception handler
 */
app.use((err, req, res, next) => {
    if (err) {
        let { code, stack, message } = err;
        ai.trackException(err, 'Server - Global handler');
        return res.contentType('application/json').send({ code, message, stack });
    }
});

async function compileCommon(request: express.Request, wrapWithRunnerChrome?: boolean): Promise<string> {
    const data: IRunnerState = JSON.parse(request.body.data);
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
            refreshUrl: (() => {
                /**
                 * Parameters needed for refresh:
                 * id, to find the snippet.
                 * host, to know which host container to find the snippet in.
                 */

                const refreshParams = {
                    host: snippet.host /* to know which host flavor to search for the snippet in */,
                    id: snippet.id /* to find the snippet */,
                    runnerUrl: request.protocol + '://' + request.get('host') /* for refreshing the snippet */,
                    returnUrl: returnUrl
                };

                return generateUrl(`${snippet.origin}/refresh.html`, refreshParams);
            })(),
            returnUrl: returnUrl,
            origin: snippet.origin,
            host: snippet.host,
            initialLoadSubtitle: `Loading "${snippet.name}"`, //'Code ● Run ● Share'
            headerTitle: snippet.name
        });
    }

    timer.stop();
    return replaceTabsWithSpaces(html);
}

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

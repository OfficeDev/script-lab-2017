import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import * as Request from 'request';
import { Utilities } from './core/utilities';
import { BadRequestError, UnauthorizedError, ServerError } from './core/errors';
import { loadTemplate } from './core/template.generator';
import { snippetGenerator } from './core/snippet.generator';

const handler = callback => (...args) => callback(...args).catch(args[2] /* pass the error as the 'next' param */);
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

/**
 * HTTP GET: /
 * Redirect to a non-error page (there is nothing to do on the root page of the runner,
 * nor do we know the environment in order to redirect to the editor)
 */
app.get('/', handler(async (req: express.Request, res: express.Response) => {
    res.writeHead(302, {
        'Location': 'https://dev.office.com'
    });
    res.send();
}));

/**
 * HTTP GET: /run
 * Returns the standalone runner page
 */
app.get('/run', handler(async (req: express.Request, res: express.Response) => {
    return res.sendfile(path.resolve(__dirname, 'assets/editor-runner.html'));
}));

/**
 * HTTP POST: /auth
 * Returns the access_token
 */
app.post('/auth/:env/:id', handler(async (req: express.Request, res: express.Response) => {
    let { code, state } = req.body;
    let { env } = req.params;

    if (code == null) {
        return new BadRequestError('Received invalid code.', code);
    }

    // TODO: Determine the right configuration
    let source = null;
    if (source == null) {
        return new BadRequestError(`Bad environment configuration: ${env}`, env);
    }

    let { client_id, client_secret, redirect_uri } = source;

    let token = await new Promise((resolve, reject) => {
        return Request.post({
            url: 'https://github.com/login/oauth/access_token',
            headers: {
                'Accept': 'application/json'
            },
            json: { client_id, client_secret, redirect_uri, code, state }
        }, (error, httpResponse, body) => error ? reject(new UnauthorizedError('Failed to authenticate user.', error)) : resolve(body));
    });

    return res.contentType('application/json').status(200).send(token);
}));

/**
 * HTTP POST: /compile/snippet
 * Returns the compiled snippet only (no outer runner chrome)
 */
app.post('/compile/snippet', handler(async (request: express.Request, response: express.Response) => {
    return response.contentType('text/html').status(200).send(
        await compileCommon(request)
    );
}));

/**
 * HTTP POST: /compile/page
 * Returns the entire page (with runner chrome) of the compiled snippet
 */
app.post('/compile/page', handler(async (request: express.Request, response: express.Response) => {
    return response.contentType('text/html').status(200).send(
        await compileCommon(request, true /*wrapWithRunnerChrome*/)
    );
}));

/**
  * Generic exception handler
 */
app.use((err, req, res, next) => {
    if (err instanceof ServerError) {
        res.status(err.code);
        return res.send(err.message);
    }
    else if (err) {
        res.status(500);
        return res.send(err.message);
    }
});

if (process.env.port == null) {
    https.createServer({
        key: fs.readFileSync(path.resolve('node_modules/browser-sync/lib/server/certs/server.key')),
        cert: fs.readFileSync(path.resolve('node_modules/browser-sync/lib/server/certs/server.crt'))
    }, app)
        .listen(3200, () => console.log('Playground server running on 3200'));
}
else {
    app.listen(process.env.PORT, () => {
        console.log(`Add-in Playground Runner listening on port ${process.env.PORT}`);
    });
}

async function compileCommon(request: express.Request, wrapWithRunnerChrome?: boolean): Promise<string> {
    const data: IRunnerState = JSON.parse(request.body.data);

    const { snippet, returnUrl } = data;
    // Note: need the return URL explicitly, so can know exactly where to return to (editor vs. gallery view),
    // and so that refresh page could know where to return to if the snippet weren't found.

    if (snippet == null) {
        throw new BadRequestError('Received invalid snippet data.', snippet);
    }

    const [compiledSnippet, snippetHtml, runnerHtml] =
        await Promise.all([
            snippetGenerator.compile(snippet),
            loadTemplate<ICompiledSnippet>('snippet'),
            wrapWithRunnerChrome ? loadTemplate<IRunnerHandlebarsContext>('runner') : null,
        ]);

    let html = snippetHtml(compiledSnippet);

    if (wrapWithRunnerChrome) {
        // Parameters needed for refresh:
        // * id, to find the snippet.
        // * host, to know which host container to find the snippet in.
        const refreshParams = {
            host: snippet.host /* to know which host flavor to search for the snippet in */,
            id: snippet.id /* to find the snippet */,
            runnerUrl: request.protocol + '://' + request.get('host') /* for refreshing the snippet */,
            returnUrl: returnUrl
        };

        html = runnerHtml({
            snippetContent: html,
            snippet: compiledSnippet,
            includeBackButton: wrapWithRunnerChrome != null,
            refreshUrl:
                `${snippet.origin}/refresh.html?${
                    (() => {
                        const result = [];
                        for (const key in refreshParams) {
                            if (refreshParams.hasOwnProperty(key)) {
                                result.push(`${key}=${encodeURIComponent(refreshParams[key])}`);
                            }
                        }
                        return result.join('&');
                    })()}`,
            returnUrl: returnUrl
        });
    }

    return Utilities.replaceAllTabsWithSpaces(html);
}

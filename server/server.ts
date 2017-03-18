import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as serverStatic from 'serve-static';
import * as cors from 'cors';
import * as Request from 'request';
import { replaceTabsWithSpaces, generateUrl } from './core/utilities';
import { BadRequestError, UnauthorizedError } from './core/errors';
import { loadTemplate } from './core/template.generator';
import { snippetGenerator } from './core/snippet.generator';
const { config, secrets } = require('./core/env.config.js');
const handler = callback => (...args) => callback(...args).catch(args[2] /* pass the error as the 'next' param */);
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(serverStatic(path.resolve(__dirname, 'favicon')));

// /**
//  * HTTP GET: /
//  * Redirect to a non-error page (there is nothing to do on the root page of the runner,
//  * nor do we know the environment in order to redirect to the editor)
//  */
// app.get('/', handler((req: express.Request, res: express.Response) => {
//     res.writeHead(302, {
//         'Location': currentConfig.editorUrl
//     });
//     return res.send();
// }));



/**
 * HTTP GET: /run
 * Returns the standalone runner page
 */
app.get('/run', handler((req: express.Request, res: express.Response) => {
    return res.sendfile(path.resolve(__dirname, 'templates/editor-runner.html'));
}));

/**
 * HTTP POST: /auth
 * Returns the access_token
 */
app.post('/auth/:env', handler(async (req: express.Request, res: express.Response) => {
    let { code, state } = req.body;
    let { env } = req.params;

    if (code == null) {
        return new BadRequestError('Received invalid code.', code);
    }

    let source = config[env] as IEnvironmentConfig;
    if (source == null) {
        return new BadRequestError(`Bad environment configuration: ${env}`, env);
    }

    let { clientId, editorUrl } = source;
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
        }, (error, httpResponse, body) => error ? reject(new UnauthorizedError('Failed to authenticate user.', error)) : resolve(body));
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
        return res.contentType('application/json').send({ code, message, stack });
    }
});

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
        html = runnerHtml({
            snippetContent: html,
            officeJS: compiledSnippet.officeJS,
            snippetId: snippet.id,
            snippetLastModified: snippet.modified_at,
            refreshUrl: generateRefreshUrl(),
            returnUrl: returnUrl,
            origin: snippet.origin,
            host: snippet.host,
            initialLoadSubtitle: `Loading "${snippet.name}"`, //'Code ● Run ● Share'
            headerTitle: snippet.name
        });
    }

    return replaceTabsWithSpaces(html);


    // Helpers

    function generateRefreshUrl() {
        // Parameters needed for refresh:
        // * id, to find the snippet.
        // * host, to know which host container to find the snippet in.
        const refreshParams = {
            host: snippet.host /* to know which host flavor to search for the snippet in */,
            id: snippet.id /* to find the snippet */,
            runnerUrl: request.protocol + '://' + request.get('host') /* for refreshing the snippet */,
            returnUrl: returnUrl
        };

        return generateUrl(`${snippet.origin}/refresh.html`, refreshParams);
    }
}

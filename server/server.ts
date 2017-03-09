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
 * HTTP POST: /run
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
 * HTTP POST: /compile
 * Returns the compiled html template
 */
app.post('/compile', handler(async (req: express.Request, res: express.Response) => {
    const data = JSON.parse(req.body.data) as IRunnerState;
    const { snippet } = data;
    if (snippet == null) {
        throw new BadRequestError('Received invalid snippet data.', snippet);
    }

    let [compiledSnippet, snippetHtml, runnerHtml] =
        await Promise.all([
            snippetGenerator.compile(snippet),
            loadTemplate<ICompiledSnippet>('snippet'),
            loadTemplate<{ iframe: string, snippet: ICompiledSnippet }>('runner'),
        ]);

    let compiledHtml = snippetHtml(compiledSnippet);
    let html = runnerHtml({ iframe: compiledHtml, snippet: compiledSnippet });
    html = Utilities.replaceAllTabsWithSpaces(html);
    return res.contentType('text/html').status(200).send(html);
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

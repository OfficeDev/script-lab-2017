import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import * as Request from 'request';
import { templateGenerator, SnippetTemplateGenerator } from './core/template.generator';
import { Utilities } from './core/utilities';
import { snippetGenerator } from './core/snippet.generator';
import { BadRequestError, UnauthorizedError, ServerError } from './core/errors';
import { config } from './core/tokens';
import * as appInsights from 'applicationinsights';

appInsights.setup(config.instrumentation_key).start();

const wrap = callback => (...args) => callback(...args).catch(args[2] /* pass the error to the next param */);

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.get('/', wrap(async (req: express.Request, res: express.Response) => {
    return res.sendfile(path.resolve(__dirname, 'assets/editor-runner.html'));
}));

app.post('/auth/:env/:id', wrap(async (req: express.Request, res: express.Response) => {
    let { code, state } = req.body;
    let { env, id } = req.params;

    if (code == null) {
        return new BadRequestError('Received invalid code.', code);
    }

    let source = config[env];
    if (source == null) {
        return new BadRequestError(`Bad environment configuration: ${env}`, env);
    }

    let { client_id, client_secret, redirect_uri } = source;

    let start = Date.now();
    let token = await new Promise((resolve, reject) => {
        return Request.post({
            url: 'https://github.com/login/oauth/access_token',
            headers: {
                'Accept': 'application/json'
            },
            json: { client_id, client_secret, redirect_uri, code, state }
        }, (error, httpResponse, body) => error ? reject(new UnauthorizedError('Failed to authenticate user.', error)) : resolve(body));
    });

    let end = Date.now();
    appInsights.client.trackEvent('[RUNNER] Authenticated User', { ID: id, }, { AUTHENTICATION: end - start, });
    return res.contentType('application/json').status(200).send(token);
}));

app.post('/', wrap(async (req: express.Request, res: express.Response) => {
    let data = JSON.parse(req.body.data) as IRunnerState;
    let { snippet } = data;
    if (snippet == null) {
        throw new BadRequestError('Received invalid snippet data.', snippet);
    }

    let start = Date.now();
    let compiledSnippet = await snippetGenerator.compile(snippet);
    let tsEnd = Date.now();

    let html = await templateGenerator.generate('inner-template.html', compiledSnippet);

    // If there are additional fields on data, like returnUrl, wrap it in the outer gallery-run template
    let wrapperContext = SnippetTemplateGenerator.createOuterTemplateContext(html, data, compiledSnippet);
    html = await templateGenerator.generate('outer-template.html', wrapperContext);
    html = Utilities.replaceAllTabsWithSpaces(html);

    let snippetEnd = Date.now();

    appInsights.client.trackEvent('[RUNNER] Compilation Complete',
        {
            ID: compiledSnippet.id,
        },
        {
            SNIPPET_COMPILE: tsEnd - start,
            TEMPLATE_COMPILE: snippetEnd - tsEnd,
            TOTAL_COMPILE: snippetEnd - start
        });

    appInsights.client.trackEvent(`[RUNNER] Running Snippet`, { ID: compiledSnippet.id });
    return res.contentType('text/html').status(200).send(html);
}));

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

https.createServer({
    key: fs.readFileSync(path.resolve('node_modules/browser-sync/lib/server/certs/server.key')),
    cert: fs.readFileSync(path.resolve('node_modules/browser-sync/lib/server/certs/server.crt'))
}, app).listen(process.env.PORT || 3200, () => {
    console.log(`Playground server running on ${process.env.PORT || 3200}`)
});

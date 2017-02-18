import * as fs from 'fs';
import * as path from 'path';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as jsyaml from 'js-yaml';
import * as cors from 'cors';
import * as request from 'request';
import { TemplateGenerator, SnippetTemplateGenerator } from './core/template.generator';
import { Utilities } from './core/utilities';
import { SnippetGenerator } from './core/snippet.generator';
import { RunnerError } from './core/runner-error';
import { config } from './core/tokens';
import * as appInsights from 'applicationinsights';


appInsights.setup(config.instrumentation_key).start();

let app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.get('/', async (req: express.Request, res: express.Response) => {
    req;
    fs.readFile(path.resolve(`${__dirname}/assets/editor-runner.html`), 'UTF8', (err, data) => {
        if (err != null) {
            return handleError(err, res);
        } else {
            return res.contentType('text/html').status(200).send(data);
        }
    });
});

app.post('/auth/:env', async (req: express.Request, res: express.Response) => {
    if (req.body == null || req.body.code == null || req.body.code.trim() === '') {
        return handleError(new RunnerError('Received invalid code.', req.body), res);
    }

    try {
        let env = req.params.env;
        let {code, state} = req.body;
        let source = config[env];

        if (source == null) {
            return handleError(new RunnerError(`Bad environment configuration: ${env}`), res);
        }

        let {client_id, client_secret, redirect_uri } = source;

        return request.post({
            url: 'https://github.com/login/oauth/access_token',
            headers: {
                'Accept': 'application/json'
            },
            json: {
                client_id,
                client_secret,
                redirect_uri,
                code,
                state
            }
        }, (error, httpResponse, body) => {
            httpResponse;
            if (error) {
                return handleError(new RunnerError('Error retrieving GitHub access token', error), res);
            }
            else {
                return res.contentType('application/json').status(200).send(body);
            }
        });
    }
    catch (error) {
        return handleError(error, res);
    }
});

app.post('/', async (request: express.Request, response: express.Response) => {
    let returnUrl: string;

    try {
        // The snippet might come in either wrapped in a serialized "data" object, or as is
        let data = request.body;
        if (!data.snippet) {
            data = JSON.parse(request.body.data);
        }
        if (!data.snippet) {
            throw new RunnerError('Received invalid snippet data.', request.body);
        }

        returnUrl = data.returnUrl;

        let start = Date.now();
        let compiledSnippet = await SnippetGenerator.compile(jsyaml.safeLoad(<string>data.snippet));
        let tsEnd = Date.now();

        TemplateGenerator.initCodeHelpers();

        let html = await TemplateGenerator.generate('inner-template.html', compiledSnippet);

        // If there are additional fields on data, like returnUrl, wrap it in the outer gallery-run template
        if (data.returnUrl) {
            let wrapperContext = SnippetTemplateGenerator
                .createOuterTemplateContext(html, data, compiledSnippet);
            html = await TemplateGenerator.generate('outer-template.html', wrapperContext);
        }

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

        appInsights.client.trackEvent(`[RUNNER] Running ${compiledSnippet.id}`, { ID: compiledSnippet.id });
        return response.contentType('text/html').status(200).send(html);
    }
    catch (error) {
        return handleError(error, response, returnUrl);
    };
});

app.listen(process.env.PORT || 3200, () => {
    console.log(`Add-in Playground Runner listening on port ${process.env.PORT || 3200}`);
});

// Helpers
async function handleError(error: Error, response: express.Response, returnUrl?: string) {
    appInsights.client.trackException(error);

    let context: { message: string, details: string, returnUrl: string } = {
        message: error.message,
        details: error instanceof RunnerError ? error.details : jsyaml.safeDump(error),
        returnUrl: returnUrl
    };

    let body = await TemplateGenerator.generate('error.html', context);
    return response.contentType('text/html').status(200).send(body);
}
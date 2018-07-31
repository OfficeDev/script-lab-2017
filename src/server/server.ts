import * as fs from 'fs';
import * as unzip from 'unzip';
import * as xml2js from 'xml2js-parser';
import * as https from 'https';
// If want to debug locally on http, comment out the above and use:
// import * as http from 'http';
import * as path from 'path';
import * as rimraf from 'rimraf';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import * as cors from 'cors';
import * as Request from 'request';
import * as Archiver from 'archiver';
import { isString, forIn, isNil, isPlainObject } from 'lodash';
import { replaceTabsWithSpaces, clipText } from './core/utilities';
import { BadRequestError, UnauthorizedError, InformationalError } from './core/errors';
import { Strings, getExplicitlySetDisplayLanguageOrNull } from './strings';
import { loadTemplateHelper, IDefaultHandlebarsContext } from './core/template.generator';
import { compileScript } from './core/snippet.generator';
import { processLibraries } from './core/libraries.processor';
import { ApplicationInsights } from './core/ai.helper';
import {
  getShareableYaml,
  isMakerScript,
  isCustomFunctionScript,
} from './core/snippet.helper';
import {
  SnippetCompileData,
  IErrorHandlebarsContext,
  IManifestHandlebarsContext,
  IReadmeHandlebarsContext,
  IRunnerHandlebarsContext,
  ISnippetHandlebarsContext,
  ITryItHandlebarsContext,
  ICustomFunctionsRunnerHandlebarsContext,
} from './interfaces';
import {
  getCustomFunctionsInfoForRegistration,
  transformSnippetName,
} from './custom-functions/utilities';
import { parseMetadata } from './custom-functions/metadata.parser';

const moment = require('moment');
const uuidV4 = require('uuid/v4');

const {
  build,
  config,
  secrets,
  USE_LOCAL_OFFLINE_COPY_OF_OFFICE_JS,
} = require('./core/env.config.js');
const env = process.env.PG_ENV || 'local';
const currentConfig = config[env] as IEnvironmentConfig;
const isLocal = currentConfig.name === 'LOCAL';
const ai = new ApplicationInsights(currentConfig.instrumentationKey);
const app = express();

let scriptLabVersionNumber;
const SCRIPT_LAB_STORE_URL = 'https://store.office.com/app/query?type=5&cmo=en-US&rt=xml';
const SCRIPT_LAB_STORE_ID = 'wa104380862';

const ONE_HOUR_MS = 3600000;
const THREE_HOUR_MS = 10800000;

// Must match the value in "runner.ts"
const EXPLICIT_NONE_OFFICE_JS_REFERENCE = '<none>';

// Note: a similar mapping exists in the client Utilities as well:
// src/client/app/helpers/utilities.ts
const officeHosts = [
  'ACCESS',
  'EXCEL',
  'ONENOTE',
  'OUTLOOK',
  'POWERPOINT',
  'PROJECT',
  'WORD',
];

const officeHostToManifestTypeMap = {
  EXCEL: 'Workbook',
  WORD: 'Document',
  POWERPOINT: 'Presentation',
  PROJECT: 'Project',
};
function supportsAddinCommands(host: string) {
  return host === 'EXCEL' || host === 'WORD' || host === 'POWERPOINT';
}
function isOfficeHost(host: string) {
  return officeHosts.indexOf(host) >= 0;
}

let generatedDirectories = {};
/* Cleans up generated template directories */
setInterval(() => {
  let ids = Object.keys(generatedDirectories);
  for (let id of ids) {
    let directoryInfo = generatedDirectories[id];
    let now = new Date().getTime();
    // If generated file is more than an hour old and isn't being read, delete it from both server and map to clean up clutter
    if (
      directoryInfo &&
      !directoryInfo.isBeingRead &&
      now - directoryInfo.timestamp > ONE_HOUR_MS
    ) {
      delete generatedDirectories[id];
      fs.unlink(directoryInfo.name, err => {
        if (err) {
          ai.trackException('File deletion failed', {
            name: directoryInfo.name,
          });
        }
      });
    }
  }
}, ONE_HOUR_MS);

/* Cleans up lurker template directories that may not have been deleted by above function (perhaps due to server restart) */
setInterval(() => {
  let filenames: string[] = [];
  for (let id of Object.keys(generatedDirectories)) {
    filenames.push(generatedDirectories[id].relativeFilePath);
  }

  fs.readdir(path.resolve(__dirname, 'working'), (err, files) => {
    if (err) {
      ai.trackException('Error reading directory', err);
      return;
    }
    ai.trackEvent('Number of generated files left to be deleted', {
      numFiles: `${files.length}`,
    });

    files.forEach(file => {
      let relativePath = `working/${file}`;
      let absolutePath = path.resolve(__dirname, relativePath);
      if (filenames.indexOf(relativePath) < 0) {
        fs.stat(absolutePath, (err, stat) => {
          let now = new Date().getTime();
          // Delete all directories older than three hours and all files older than three hours that are not in map
          if (now - stat.mtime.getMilliseconds() > THREE_HOUR_MS) {
            if (stat.isDirectory()) {
              rimraf(absolutePath, () => {});
            } else {
              fs.unlink(absolutePath, err => {
                ai.trackException('File deletion failed', {
                  name: absolutePath,
                });
              });
            }
          }
        });
      }
    });
  });
}, 12540000); /* 209 minutes in ms; chosen to avoid clash with above interval*/

/**
 * Server CERT and PORT configuration
 */
if (process.env.NODE_ENV === 'production') {
  app.listen(process.env.port || 1337, () =>
    console.log(`Script Lab Runner listening on port ${process.env.PORT}`)
  );
} else {
  const cert = {
    key: fs.readFileSync(
      path.resolve('node_modules/browser-sync/lib/server/certs/server.key')
    ),
    cert: fs.readFileSync(
      path.resolve('node_modules/browser-sync/lib/server/certs/server.crt')
    ),
  };
  https
    .createServer(cert, app)
    .listen(3200, () => console.log('Playground server running on 3200'));

  // TO DEBUG LOCALLY, comment out the above, and instead use
  // http.createServer(app).listen(3200, () => console.log('Playground server running on 3200'));
}

app.use(cookieParser());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(cors());
app.use('/favicon', express.static('favicon'));

// Return just the regular runner page on the following routes:
registerRoute(
  'get',
  ['/', '/run', '/compile', '/compile/page', '/compile/snippet'],
  (req, res) =>
    runCommon(
      {
        host: null,
        id: null,
        query: req.query,
        explicitlySetDisplayLanguageOrNull: getExplicitlySetDisplayLanguageOrNull(req),
      },
      Strings(req),
      res
    )
);

registerRoute('get', ['/compile/custom-functions'], (req, res) =>
  Promise.resolve().then(() => respondWith(res, '', 'text/html'))
);

/**
 * HTTP GET: /run
 * Returns a runner page, with the following parameters:
 * Required:
 *   - host
 *   - id
 * Optional query parameters:
 *   - officeJS: Office.js reference (to allow switching between prod and beta, minified vs release)
 *               If not specified, default production Office.js will be assumed for Office snippets.
 */
registerRoute('get', ['/run/:host', '/run/:host/:id'], (req, res) =>
  runCommon(
    {
      host: req.params.host,
      id: req.params.id,
      query: req.query,
      explicitlySetDisplayLanguageOrNull: getExplicitlySetDisplayLanguageOrNull(req),
    },
    Strings(req),
    res
  )
);

/**
 * HTTP POST: /auth
 * Returns the access_token
 */
registerRoute('post', '/auth/:user', (req, res) => {
  const { code, state } = req.body;
  const { user } = massageParams<{ user: string }>(req);
  const strings = Strings(req);

  if (code == null) {
    throw new BadRequestError(strings.receivedInvalidAuthCode, code);
  }

  const { clientId, editorUrl } = currentConfig;
  const timer = ai.trackTimedEvent('[Runner] GitHub Authentication');

  // NOTE: using Promise-based code instead of async/await
  // to avoid unhandled exception-pausing on debugging.
  return new Promise((resolve, reject) => {
    return Request.post(
      {
        url: 'https://github.com/login/oauth/access_token',
        headers: {
          Accept: 'application/json',
        },
        json: {
          client_id: clientId,
          client_secret: getClientSecret(),
          redirect_uri: editorUrl,
          code,
          state,
        },
      },
      (error, httpResponse, body) => {
        timer.stop();
        if (error) {
          ai.trackEvent('[Github] Login failed', { user });
          return reject(new UnauthorizedError(strings.failedToAuthenticateUser, error));
        } else {
          ai.trackEvent('[Github] Login succeeded', { user });
          return resolve(body);
        }
      }
    );
  }).then(token =>
    res
      .contentType('application/json')
      .status(200)
      .send(token)
  );
});

/**
 * HTTP POST: /compile/snippet
 * Returns the compiled snippet only (no outer runner chrome)
 */
registerRoute('post', '/compile/snippet', compileSnippetCommon);

/**
 * HTTP POST: /compile/page
 * Returns the entire page (with runner chrome) of the compiled snippet
 */
registerRoute('post', '/compile/page', (req, res) =>
  compileSnippetCommon(req, res, true /*wrapWithRunnerChrome*/)
);

/**
 * HTTP POST: /run/custom-functions
 * Returns a page for rendering in the UI-less control for custom functions.
 * Note that all snippets passed to this page are already expected to be trusted.
 */
registerRoute('post', '/custom-functions/run', async (req, res) => {
  const params: IRunnerCustomFunctionsPostData = JSON.parse(req.body.data);
  let { snippets, loadFromOfficeJsPreviewCachedCopy } = params;

  snippets = snippets.filter(snippet => {
    const result = parseMetadata(
      transformSnippetName(snippet.name),
      snippet.script.content
    );
    const isGoodSnippet =
      result.length > 0 && !result.some(func => (func.error ? true : false));
    const namespace = transformSnippetName(snippet.name);
    snippet.metadata = {
      namespace,
      functions: result,
    };
    return isGoodSnippet;
  });

  const strings = Strings(req);
  const timer = ai.trackTimedEvent('[Runner] Running Custom Functions');

  const customFunctionsRunnerGenerator = await loadTemplate<
    ICustomFunctionsRunnerHandlebarsContext
  >('custom-functions-runner');

  const snippetCompileResults = await Promise.all(
    snippets.map(snippet => {
      const data: SnippetCompileData = {
        id: snippet.id,
        isOfficeSnippet: true,
        libraries: snippet.libraries,
        name: snippet.name,
        scriptToCompile: snippet.script,
        shouldPutSnippetIntoOfficeInitialize: false,
        template: { content: '', language: 'html' },
        style: { content: '', language: 'css' },
      };

      return generateSnippetHtmlData(
        data,
        false /*isExternalExport*/,
        strings,
        true /*isInsideOfficeApp*/,
        {
          customFunctionsIfAny: snippet.metadata.functions.map(func => ({
            fullName: `${snippet.metadata.namespace}.${func.funcName}`.toUpperCase(),
            funcName: func.funcName,
          })),
        }
      );
    })
  );

  const customFunctionsOfficeJsLocation = `${currentConfig.editorUrl}/assets/${
    loadFromOfficeJsPreviewCachedCopy
      ? 'office-js-custom-functions-2018-05-design--npm-custom-functions-preview-tag'
      : 'office-js-custom-functions-2018-07-design--api-set-1.3-or-later'
  }/office.js`;

  const html = customFunctionsRunnerGenerator({
    customFunctionsOfficeJsLocation,
    snippetsDataBase64: base64encode(
      JSON.stringify(snippetCompileResults.map(result => result.html))
    ),
    metadataBase64: base64encode(
      JSON.stringify(snippets.map(snippet => ({ id: snippet.id, ...snippet.metadata })))
    ),
    clientTimestamp: params.heartbeatParams.clientTimestamp,
    loadFromOfficeJsPreviewCachedCopy: loadFromOfficeJsPreviewCachedCopy,
  });

  timer.stop();
  return respondWith(res, html, 'text/html');
});

registerRoute('post', '/custom-functions/parse-metadata', async (req, res) => {
  const strings = Strings(req);
  const params: ICustomFunctionsMetadataRequestPostData = JSON.parse(req.body.data);
  const { snippets } = params;
  const registrationInfo = getCustomFunctionsInfoForRegistration(snippets, strings);

  return respondWith(res, JSON.stringify(registrationInfo), 'application/javascript');
});

registerRoute('get', '/open/:host/:type/:id/:filename', async (req, res) => {
  const params = massageParams<{
    host: string;
    type: string;
    id: string;
    filename: string;
  }>(req);

  let relativePath, templateName;
  switch (params.host.toUpperCase()) {
    case 'EXCEL':
      relativePath = 'xl';
      templateName = 'excel-template';
      break;
    case 'WORD':
      relativePath = 'word';
      templateName = 'word-template';
      break;
    case 'POWERPOINT':
      relativePath = 'ppt';
      templateName = 'powerpoint-template';
      break;
    default:
      throw new Error(`Unsupported host: ${params.host}`);
  }

  const correlationId = req.query.correlationId;
  let directoryInfo = generatedDirectories[correlationId];
  // Check if file already exists on server for correlation id
  if (directoryInfo) {
    directoryInfo.isBeingRead = true;
    fs.createReadStream(directoryInfo.name).pipe(res);
    res.attachment(params.filename);
    res.on('finish', () => {
      directoryInfo.isBeingRead = false;
    });
  } else {
    return getVersionNumber().then(versionNumber => {
      let timestamp = new Date().getTime();
      let relativeFilePath = `working/${templateName}${timestamp}`;
      let extractDirName = path.resolve(__dirname, relativeFilePath);
      let zip = fs
        .createReadStream(path.resolve(__dirname, `${templateName}.zip`))
        .pipe(unzip.Extract({ path: extractDirName }));

      zip.on('close', () => {
        let xmlFileName = `${extractDirName}/${relativePath}/webextensions/webextension1.xml`;
        new Promise<string>((resolve, reject) => {
          fs.readFile(xmlFileName, (err, data) => {
            if (err) {
              throw err;
            } else {
              let xmlStringData = data.toString();
              xmlStringData = xmlStringData
                .replace('%placeholder_version%', versionNumber)
                .replace('%placeholder_type%', params.type)
                .replace('%placeholder_id%', params.id)
                .replace('%placeholder_correlation_id%', correlationId);
              return resolve(xmlStringData);
            }
          });
        }).then(xmlStringData => {
          fs.writeFile(xmlFileName, xmlStringData, err => {
            if (err) {
              throw err;
            }

            let zipFileName = `${extractDirName}.zip`;
            let writeZipFile = fs.createWriteStream(zipFileName);
            writeZipFile.on('finish', () => {
              rimraf(extractDirName, () => {});
              res.attachment(params.filename);
              fs.createReadStream(zipFileName).pipe(res);
              res.on('finish', () => {
                generatedDirectories[correlationId] = {
                  name: zipFileName,
                  relativeFilePath: `${relativeFilePath}.zip`,
                  isBeingRead: false,
                  timestamp,
                };
              });
            });

            const archiver = Archiver('zip');
            archiver.pipe(writeZipFile);
            archiver.directory(extractDirName, '');
            archiver.finalize();
          });
        });
      });
    });
  }
});

registerRoute('post', '/export', (req, res) => {
  const data: IExportState = JSON.parse(req.body.data);
  const { snippet, additionalFields, sanitizedFilenameBase } = data;
  const strings = Strings(req);

  const filenames = {
    html: sanitizedFilenameBase + '.html',
    yaml: sanitizedFilenameBase + '--snippet-data.yaml',
    manifest: sanitizedFilenameBase + '--manifest.xml',
    readme: 'README.md',
  };

  // NOTE: using Promise-based code instead of async/await
  // to avoid unhandled exception-pausing on debugging.
  return Promise.all([
    generateSnippetHtmlData(
      {
        scriptToCompile: snippet.script,
        shouldPutSnippetIntoOfficeInitialize: null,
        ...extractCommonCompileData(snippet),
      },
      true /*isExternalExport*/,
      strings,
      isOfficeHost(snippet.host)
    ),
    generateReadme(snippet),
    isOfficeHost(snippet.host)
      ? generateManifest(snippet, additionalFields, filenames.html, strings)
      : null,
  ]).then(results => {
    const htmlData: { html: string; officeJS: string } = results[0];
    const readme = results[1];
    const manifestIfAny: string = results[2];

    res.set('Content-Type', 'application/zip');

    const zip = Archiver('zip')
      .append(htmlData.html, { name: filenames.html })
      .append(getShareableYaml(snippet, additionalFields), {
        name: filenames.yaml,
      })
      .append(readme, { name: filenames.readme });

    if (manifestIfAny) {
      zip.append(manifestIfAny, { name: filenames.manifest });
    }

    zip.finalize();
    zip.pipe(res);
  });
});

registerRoute('get', ['/try', '/try/:host', '/try/:host/:type/:id'], (req, res) => {
  const params = massageParams<{ host: string; type: string; id: string }>(req);
  if (!params.host) {
    params.host = 'EXCEL';
  }

  let editorTryItUrl = `${currentConfig.editorUrl}/?tryIt=true`;
  if (req.query.wacUrl) {
    editorTryItUrl += `&wacUrl=${decodeURIComponent(req.query.wacUrl)}`;
  }
  editorTryItUrl += `#/edit/${params.host}`;

  if (params.type && params.id) {
    editorTryItUrl += `/${params.type}/${params.id}`;
  }

  return loadTemplate<ITryItHandlebarsContext>('try-it').then(tryItGenerator => {
    const html = tryItGenerator({
      host: params.host,
      pageTitle: Strings(req).tryItPageTitle,
      initialLoadSubtitle: Strings(req).playgroundTagline,
      editorTryItUrl: editorTryItUrl,
      wacUrl: decodeURIComponent(req.query.wacUrl || ''),
    });

    return respondWith(res, html, 'text/html');
  });
});

/** HTTP GET: Gets runner version info (useful for debugging, to match with the info in the Editor "about" view) */
registerRoute('get', '/version', (req, res) => {
  const strings = Strings(req);
  throw new InformationalError(
    strings.versionInfo,
    JSON.stringify(
      {
        build: build,
        editorUrl: currentConfig.editorUrl,
        runnerUrl: currentConfig.runnerUrl,
        samplesUrl: currentConfig.samplesUrl,
      },
      null,
      4
    )
  );
});

/** HTTP GET: Gets runner version info (useful for debugging, to match with the info in the Editor "about" view) */
registerRoute('get', '/snippet/auth', async (req, res) =>
  respondWith(res, (await loadTemplate('snippet-auth'))({}), 'text/html')
);

registerRoute('get', '/lib/worker', async (req, res) => {
  let worker = fs
    .readFileSync(path.resolve(__dirname, './maker/maker-worker.js'))
    .toString();
  return respondWith(res, worker, 'application/javascript');
});

registerRoute('get', '/lib/sync-office-js', async (req, res) => {
  let syncOfficeJS = [
    fs
      .readFileSync(path.resolve(__dirname, './maker/sync-office-js/Office.Runtime.js'))
      .toString(),
    fs
      .readFileSync(path.resolve(__dirname, './maker/sync-office-js/office.core.js'))
      .toString(),
    fs
      .readFileSync(path.resolve(__dirname, './maker/sync-office-js/Excel.js'))
      .toString(),
  ].join('\n');

  return respondWith(res, syncOfficeJS, 'application/javascript');
});

// HELPERS

function compileSnippetCommon(
  req: express.Request,
  res: express.Response,
  wrapWithRunnerChrome?: boolean
) {
  const data: IRunnerState = JSON.parse(req.body.data);
  const { snippet, returnUrl, isInsideOfficeApp, refreshUrl } = data;

  let isTrustedSnippet: boolean = req.body.isTrustedSnippet || false;

  const timer = ai.trackTimedEvent('[Runner] Compile Snippet', {
    id: snippet.id,
  });

  const strings = Strings(req);

  let snippetDataToCompile = {
    scriptToCompile: snippet.script,
    shouldPutSnippetIntoOfficeInitialize: null,
    ...extractCommonCompileData(snippet),
  };

  // NOTE: using Promise-based code instead of async/await
  // to avoid unhandled exception-pausing on debugging.
  return Promise.all([
    generateSnippetHtmlData(
      snippetDataToCompile,
      false /*isExternalExport*/,
      strings,
      isInsideOfficeApp
    ),
    wrapWithRunnerChrome ? loadTemplate<IRunnerHandlebarsContext>('runner') : null,
  ]).then(values => {
    const snippetHtmlData: { html: string; officeJS: string } = values[0];
    const runnerHtmlGenerator: (context: IRunnerHandlebarsContext) => string = values[1];

    let html = snippetHtmlData.html;
    const isMaker = isMakerScript(snippet.script);
    let officeJS = snippetHtmlData.officeJS;
    if (isMaker && !isInsideOfficeApp) {
      officeJS = EXPLICIT_NONE_OFFICE_JS_REFERENCE;
    }

    if (wrapWithRunnerChrome) {
      html = runnerHtmlGenerator({
        snippet: {
          id: snippet.id,
          lastModified: snippet.modified_at,
          content: base64encode(html),
          isMakerScript: isMaker,
        },
        officeJS,
        returnUrl: returnUrl,
        refreshUrl: refreshUrl,
        host: snippet.host,
        isTrustedSnippet,
        initialLoadSubtitle: strings.getLoadingSnippetSubtitle(snippet.name),
        headerTitle: snippet.name,
        strings,
        explicitlySetDisplayLanguageOrNull: getExplicitlySetDisplayLanguageOrNull(req),
      });
    }

    timer.stop();
    return respondWith(res, html, 'text/html');
  });
}

function runCommon(
  options: {
    /** host, may be null */
    host: string;
    /** id, may be null */
    id: string;
    /** query string, may be null */
    query: { [key: string]: string };
    /** language, may be null */
    explicitlySetDisplayLanguageOrNull: string;
  },
  strings: ServerStrings,
  res: express.Response
) {
  let { host, id } = massageParams<{ host: string; id: string }>(options);
  id = id || '';
  host = host || '';
  options.query = options.query || {};

  // NOTE: using Promise-based code instead of async/await
  // to avoid unhandled exception-pausing on debugging.
  return loadTemplate<IRunnerHandlebarsContext>('runner').then(runnerHtmlGenerator => {
    const html = runnerHtmlGenerator({
      snippet: {
        id: id,
        isMakerScript: false,
      },
      officeJS: determineOfficeJS(options.query, host),
      returnUrl: '',
      host: host,
      isTrustedSnippet: false /* Default to snippet not being trusted */,
      initialLoadSubtitle: strings.playgroundTagline,
      headerTitle: strings.scriptLabRunner,
      strings,
      explicitlySetDisplayLanguageOrNull: options.explicitlySetDisplayLanguageOrNull,
    });

    return respondWith(res, html, 'text/html');
  });

  /**
   * Helper function to return the OfficeJS URL (from query parameter,
   * or from guessing based on host), or empty string
   **/
  function determineOfficeJS(query: { [key: string]: string }, host: string): string {
    const queryParamsLowercase: { officejs: string } = <any>{};
    forIn(query, (value, key) => (queryParamsLowercase[key.toLowerCase()] = value));

    if (queryParamsLowercase.officejs && queryParamsLowercase.officejs.trim() !== '') {
      const candidateOfficeJs = queryParamsLowercase.officejs.trim();
      if (isLocal && candidateOfficeJs.toLowerCase().indexOf('{localhost}') >= 0) {
        return getDefaultHandlebarsContext().officeJsOrLocal;
      } else {
        return candidateOfficeJs;
      }
    }

    if (isOfficeHost(host.toUpperCase())) {
      // Assume a production Office.js for the Office products --
      // and worse case (e.g., if targeting Beta, or debug version),
      // the runner will just force a refresh after the page has loaded
      return getDefaultHandlebarsContext().officeJsOrLocal;
    }

    return '';
  }
}

function respondWith(
  res: express.Response,
  content: string,
  type: 'text/html' | 'application/javascript'
) {
  res.setHeader('Cache-Control', 'no-cache, no-store');
  res.setHeader('X-XSS-Protection', '0');
  return res
    .contentType(type)
    .status(200)
    .send(type === 'text/html' ? replaceTabsWithSpaces(content) : content);
}

function parseXmlString(xml): Promise<JSON> {
  return new Promise((resolve, reject) => {
    xml2js.parseString(xml, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

function getVersionNumber(): Promise<string> {
  return new Promise((resolve, reject) => {
    return Request.post(
      {
        url: SCRIPT_LAB_STORE_URL,
        body: SCRIPT_LAB_STORE_ID,
      },
      (error, httpResponse, body) => {
        if (error) {
          ai.trackException('[Snippet] Get version number failed', error);
          return reject(error);
        } else {
          ai.trackEvent('[Snippet] Get version number succeeded', { body });
          return resolve(body);
        }
      }
    );
  })
    .then(xml => parseXmlString(xml))
    .then(xmlJson => {
      scriptLabVersionNumber = xmlJson['o:results']['o:wainfo'][0]['$']['o:ver'];
      return scriptLabVersionNumber;
    })
    .catch(e => {
      if (!isNil(scriptLabVersionNumber)) {
        /* return previously retrieved version if web request fails */
        return scriptLabVersionNumber;
      }
      throw e;
    });
}

async function generateSnippetHtmlData(
  compileData: SnippetCompileData,
  isExternalExport: boolean,
  strings: ServerStrings,
  isInsideOfficeApp: boolean,
  extras: Partial<ISnippetHandlebarsContext> = {}
): Promise<{ succeeded: boolean; html: string; officeJS: string }> {
  let script: string;
  try {
    script = compileScript(compileData.scriptToCompile, strings);
  } catch (e) {
    if (e instanceof InformationalError) {
      ai.trackEvent('Server - Script compile error', {
        snippetId: compileData.id,
      });
      return {
        succeeded: false,
        html: await generateErrorHtml(e, strings),
        officeJS: null,
      };
    }
    throw e;
  }

  let { officeJS, linkReferences, scriptReferences } = processLibraries(
    compileData.libraries,
    isMakerScript(compileData.scriptToCompile),
    isInsideOfficeApp
  );

  let shouldPutSnippetIntoOfficeInitialize;
  if (compileData.shouldPutSnippetIntoOfficeInitialize === null) {
    shouldPutSnippetIntoOfficeInitialize = false;
    if (officeJS && officeJS !== EXPLICIT_NONE_OFFICE_JS_REFERENCE) {
      shouldPutSnippetIntoOfficeInitialize = true;
    }
  } else {
    shouldPutSnippetIntoOfficeInitialize =
      compileData.shouldPutSnippetIntoOfficeInitialize;
  }

  let template = (compileData.template || { content: '' }).content;
  let style = (compileData.style || { content: '' }).content;

  if (isCustomFunctionScript(compileData.scriptToCompile.content)) {
    // QUICK WORKAROUND: this hardcoded string is special, do not remove it!  It will
    // force the runner to redirect to the Custom Functions dashboard.
    // It is used inside of "runner.ts"
    const CFRunnerHeader = 'This snippet is a Custom Functions snippet.';

    const CFRunnerBody =
      'Please open the Custom Function dashboard via the "Functions" button in the ribbon.';
    const CFTemplate = `<h1>${CFRunnerHeader}</h1><p>${CFRunnerBody}</p>`;

    template = CFTemplate;
    style = `body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif }`;
  }

  const snippetHandlebarsContext: ISnippetHandlebarsContext = {
    snippet: {
      id: compileData.id,
      name: compileData.name,
      style,
      template,
      script,
      officeJS,
      linkReferences,
      scriptReferences,
    },

    isOfficeSnippet: compileData.isOfficeSnippet,
    isExternalExport,
    strings,

    runtimeHelpersUrls: ['auth-helpers', 'maker'].map(item => getRuntimeHelpersUrl(item)),

    editorUrl: currentConfig.editorUrl,
    runtimeHelperStringifiedStrings: JSON.stringify(
      strings.RuntimeHelpers
    ) /* stringify so that it gets written correctly into "snippets" template */,
    shouldPutSnippetIntoOfficeInitialize,

    ...extras,
  };

  const snippetHtmlGenerator = await loadTemplate<ISnippetHandlebarsContext>('snippet');
  return {
    succeeded: true,
    html: snippetHtmlGenerator(snippetHandlebarsContext),
    officeJS,
  };
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
    throw new BadRequestError(
      `Cannot find matching Office host type for snippet host "${snippet.host}"`
    );
  }

  const snippetNameMax125 =
    clipText(snippet.name, 125) || strings.manifestDefaults.nameIfEmpty;
  const snippetDescriptionMax250 =
    clipText(snippet.description, 250) || strings.manifestDefaults.descriptionIfEmpty;

  return manifestGenerator({
    name: snippetNameMax125,
    description: snippetDescriptionMax250,
    snippetNameMax125,
    snippetDescriptionMax250,
    htmlFilename,
    providerName:
      snippet.author || additionalFields.author || strings.createdWithScriptLab,
    hostType,
    supportsAddinCommands: supportsAddinCommands(snippet.host),
    guid: uuidV4(),
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
  app[verb](path, async (req: express.Request, res: express.Response) => {
    try {
      return await action(req, res);
    } catch (e) {
      const strings = Strings(req);
      return await errorHandler(res, e, strings);
    }
  });
}

async function errorHandler(res: express.Response, error: Error, strings: ServerStrings) {
  if (!(error instanceof InformationalError)) {
    ai.trackException(error, 'Server - Per-route handler');
  }

  const html = await generateErrorHtml(error, strings);
  return respondWith(res, html, 'text/html');
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
      (error instanceof BadRequestError || error instanceof InformationalError) &&
      error.details != null;

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
    title,
    message,
    details,
    expandDetailsByDefault,
  });
}

let _defaultHandlebarsContext: IDefaultHandlebarsContext;
function getDefaultHandlebarsContext(): IDefaultHandlebarsContext {
  if (!_defaultHandlebarsContext) {
    let versionedPackageNames = getFileAsJson('versionPackageNames.json');
    _defaultHandlebarsContext = {
      origin: currentConfig.editorUrl,
      assets: getFileAsJson('assets.json'),
      officeJsOrLocal:
        isLocal && USE_LOCAL_OFFLINE_COPY_OF_OFFICE_JS
          ? versionedPackageNames['@microsoft/office-js']
          : 'https://appsforoffice.microsoft.com/lib/1/hosted/office.js',
      versionedPackageNames_office_ui_fabric_js:
        versionedPackageNames['office-ui-fabric-js'],
      versionedPackageNames_jquery: versionedPackageNames['jquery'],
      versionedPackageNames_jquery_resizable_dom:
        versionedPackageNames['jquery-resizable-dom'],
    };
  }

  return _defaultHandlebarsContext;

  function getFileAsJson(filename) {
    return JSON.parse(fs.readFileSync(path.resolve(__dirname, filename)).toString());
  }
}

function loadTemplate<T>(templateName: string) {
  return loadTemplateHelper<T>(templateName, getDefaultHandlebarsContext());
}

let _runnerHashIfAny: string;
function getRuntimeHelpersUrl(filename: string) {
  if (!_runnerHashIfAny) {
    let assetPaths = getDefaultHandlebarsContext().assets;
    // Some assets, like the runtime helpers, are not compiled with webpack.
    // Instead, they are manually copied, and end up with no hash.
    // So, to guarantee their freshness, use the runner hash (once per deployment)
    // as a good approximation for when it's time to get a new version.
    let runnerHashPattern = /^bundles\/runner\.(\w*)\.bundle.js/;
    let runnerHashMatch = runnerHashPattern.exec(assetPaths.runner.js);
    if (runnerHashMatch && runnerHashMatch.length === 2) {
      _runnerHashIfAny = runnerHashMatch[1];
    }
  }

  return (
    `${currentConfig.editorUrl}/libs/${filename}.js` +
    (_runnerHashIfAny ? '?hash=' + _runnerHashIfAny : '')
  );
}

function getClientSecret() {
  if (isLocal) {
    return (currentConfig as ILocalHostEnvironmentConfig).clientSecretLocalHost;
  }

  return secrets ? secrets[env] : '';
}

function extractCommonCompileData(snippet: ISnippet) {
  const { id, libraries, name, style, template } = snippet;
  const isOfficeSnippet = isOfficeHost(snippet.host);
  return { isOfficeSnippet, id, libraries, name, style, template };
}

/** Returns the params as a typed object, with "host" always capitalized, and "id" always lowercase */
function massageParams<T>(req: express.Request): T;
function massageParams<T>(params: { [key: string]: any }): T;
function massageParams<T>(input) {
  let params: { host?: string; id?: string } = isPlainObject(input)
    ? input
    : (input as express.Request).params;

  if (params.host) {
    params.host = params.host.toUpperCase();
  }

  if (params.id) {
    params.id = params.id.toLowerCase();
  }

  return params as T;
}

function base64encode(input: string) {
  return Buffer.from(input).toString('base64');
}

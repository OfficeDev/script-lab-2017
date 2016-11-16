import { Utilities } from './utilities';
import { PlaygroundError } from './uxutil';
import { Snippet, SnippetManager } from '../services';

/** GistResponse. Note: only exposing the relevant bits */
export interface IGistResponse {
    files: { [key: string]: IGistFileJson };
}

/** GistFileJson. Note: only exposing the relevant bits */
export interface IGistFileJson {
    content: string;
    filename: string;
    language: string;
    raw_url: string;
    truncated: boolean
}

export interface IGistPostData {
    public: boolean
    description: string,
    files: { [name: string]: any }
}

export class GistUtilities {
    static sampleGistId = '8a58218a48d39d40431cf934e62a71a2';

    static getMetadata(gist: IGistResponse): Promise<ISnippet> {
        return Promise.resolve().then(() => {
            let metadataCandidates = [];
            for (let filename in gist.files) {
                if (filename.toLowerCase().endsWith('.json')) {
                    metadataCandidates.push(filename);
                }
            }

            switch (metadataCandidates.length) {
                case 0:
                    throw new PlaygroundError(
                        'Could not find a metadata JSON file within the Gist snippet.\n' +
                        'Expecting a Gist that was exported by the Playground and that has ' +
                        'a single file named <filename>.json within it.');

                case 1:
                    let filename = metadataCandidates[0];
                    let metaJson: ISnippet;

                    return GistUtilities.getFileContent(gist.files[filename])
                        .then((metaFileContents) => {
                            if (!Utilities.isJSON(metaFileContents)) {
                                throw new PlaygroundError('Contents of the file "' + filename +
                                    '" was not a valid JSON object.');
                            }

                            return JSON.parse(metaFileContents);
                        });

                default:
                    throw new PlaygroundError(
                        'The Gist contains more that one .json file.\n' +
                        'Expecting a Gist that was exported by the Playground and that has ' +
                        'a single file named <filename>.json within it.');
            }
        });
    }

    static getFileContent(fileJson: IGistFileJson): Promise<string> {
        console.log('Retrieving file ' + fileJson.filename);

        if (fileJson.truncated) {
            console.log('File is truncated, loading from ' + fileJson.raw_url);
            return new Promise((resolve, reject) => {
                $.getJSON(fileJson.raw_url)
                    .then((content) => content)
                    .fail((e) => {
                        reject(e);
                    });
            });
        } else {
            console.log('File is small enough that it was already fully-loaded during the initial request. ' +
                'Resolving with content as is.');
            return Promise.resolve(fileJson.content);
        }
    }

    static processPlaygroundSnippet(metaJson: ISnippet, gist: IGistResponse, nameOverride?: string): Promise<Snippet> {
        if (_.isUndefined(metaJson.playgroundVersion)) {
            throw new PlaygroundError('Missing a metadata file with a "playgroundVersion" field in the Gist.');
        }

        let allNonMetaFiles = [];
        for (let filename in gist.files) {
            if (!filename.toLowerCase().endsWith('.json')) {
                allNonMetaFiles.push(filename);
            }
        }

        switch (metaJson.playgroundVersion) {
            case 1:
                return createSnippetFromPlaygroundVersion1_0();
            default:
                throw new PlaygroundError('Invalid playgroundVersion version "' +
                    metaJson.playgroundVersion + '" specified in the JSON metadata.');
        }

        function createSnippetFromPlaygroundVersion1_0() {
            return Promise.all(allNonMetaFiles.map((filename) => {
                return GistUtilities.getFileContent(gist.files[filename])
                    .then((content) => {
                        return { filename: filename, content: content };
                    });
            })).then((items) => {
                let contentObject = {};
                items.forEach((item: any) => contentObject[item.filename] = item.content);

                return new Snippet({
                    id: '',
                    name: nameOverride ? nameOverride : metaJson.name,
                    script: contentObject['app.ts'],
                    template: contentObject['index.html'],
                    style: contentObject['style.css'],
                    libraries: contentObject['libraries.txt'].split('/n')
                });
            });
        }
    }

    static postGist(token: string, createData: IGistPostData): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                let response = await $.ajax({
                    url: 'https://api.github.com/gists',
                    type: 'POST',
                    beforeSend: xhr => {
                        if (token) {
                            xhr.setRequestHeader('Authorization', 'Bearer ' + token);
                        }
                    },
                    data: JSON.stringify(createData)
                });

                resolve(response.id);
            }
            catch (e) {
                reject(e.responseText);
            };
        });
    }
}

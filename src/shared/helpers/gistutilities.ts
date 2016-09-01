import {Utilities} from './utilities'
import {PlaygroundError} from './uxutil'
import {ISnippetMeta, ISnippet, Snippet, SnippetManager} from '../services'

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

export class GistUtilities {   
    static getMetadata(gist: IGistResponse): Promise<ISnippetMeta> {
        return Promise.resolve().then(() => {
            var metadataCandidates = [];
            for (let filename in gist.files) {
                if (filename.toLowerCase().endsWith(".json")) {
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
                    var filename = metadataCandidates[0];
                    var metaJson: ISnippetMeta;

                    return GistUtilities.getFileContent(gist.files[filename])
                        .then((metaFileContents) => {
                            if (!Utilities.isJson(metaFileContents)) {
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

    static processPlaygroundSnippet(metaJson: ISnippetMeta, gist: IGistResponse): Promise<Snippet> {
        if (_.isUndefined(metaJson.playgroundVersion)) {
            throw new PlaygroundError('Missing a metadata file with a "playgroundVersion" field in the Gist.');
        }

        var allNonMetaFiles = [];
        for (let filename in gist.files) {
            if (!filename.toLowerCase().endsWith(".json")) {
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
                        return {filename: filename, content: content}
                    });
            })).then((items) => {
                var contentObject = {};
                items.forEach((item: any) => contentObject[item.filename] = item.content);
                
                return new Snippet({
                    meta: {
                        name: metaJson.name
                    },
                    script: contentObject['app.ts'],
                    html: contentObject['index.html'],
                    css: contentObject['style.css'],
                    libraries: contentObject['libraries.txt']
                });
            });
        }
    }
}
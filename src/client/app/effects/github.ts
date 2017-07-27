import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { AI, Strings, getShareableYaml, environment } from '../helpers';
import { GitHubService } from '../services';
import { Store, Action } from '@ngrx/store';
import { UI, GitHub } from '../actions';
import { Effect, Actions } from '@ngrx/effects';
import { Http, ResponseContentType } from '@angular/http';
import * as clipboard from 'clipboard';
import { UIEffects } from './ui';
import { find } from 'lodash';
import * as moment from 'moment';
import * as fromRoot from '../reducers';

const FileSaver = require('file-saver');

@Injectable()
export class GitHubEffects {
    constructor(
        private actions$: Actions,
        private _github: GitHubService,
        private _http: Http,
        private _uiEffects: UIEffects,
        private _store: Store<fromRoot.State>,
    ) {
    }

    @Effect()
    login$: Observable<Action> = this.actions$
        .ofType(GitHub.GitHubActionTypes.LOGIN)
        .mergeMap(() => this._github.login())
        .map(profile => new GitHub.LoggedInAction(profile))
        .catch(exception => Observable.from([
            new UI.ReportErrorAction(Strings.githubLoginFailed, exception),
            new GitHub.LoginFailedAction()
        ]));

    @Effect({ dispatch: false })
    logout$: Observable<Action> = this.actions$
        .ofType(GitHub.GitHubActionTypes.LOGGED_OUT)
        .map(() => this._github.logout())
        .catch(exception => Observable.of(new UI.ReportErrorAction(Strings.githubLogoutFailed, exception)));

    @Effect()
    loggedIn$: Observable<Action> = this.actions$
        .ofType(GitHub.GitHubActionTypes.LOGGED_IN)
        .map(() => new GitHub.LoadGistsAction());

    @Effect()
    isLoggedIn$: Observable<Action> = this.actions$
        .ofType(GitHub.GitHubActionTypes.IS_LOGGED_IN)
        .map(() => this._github.profile)
        .filter(profile => !(profile == null))
        .mergeMap(profile => Observable.from([new GitHub.LoggedInAction(profile)]))
        .catch(exception => Observable.of(new UI.ReportErrorAction(Strings.profileCheckFailed, exception)));

    @Effect()
    loadGists$: Observable<Action> = this.actions$
        .ofType(GitHub.GitHubActionTypes.LOAD_GISTS)
        .mergeMap(() => this._github.gists())
        .map(gists => {
            return gists
                .map(gist => ({
                    id: gist.id,
                    description: gist.description,
                    file: find(gist.files, (file, name) => file ? /\.ya?ml$/gi.test(name) : false)
                }))
                .map(({ id, file, description }) => {
                    if (file == null) {
                        return null;
                    }

                    return <ISnippet>{
                        id: '',
                        name: file.filename.replace(/\.ya?ml$/gi, ''),
                        gist: id,
                        description: description
                    };
                })
                .filter(snippet => !(snippet == null));
        })
        .map(snippets => new GitHub.LoadGistsSuccessAction(snippets))
        .catch(exception => Observable.of(new UI.ReportErrorAction(Strings.gistRetrieveFailed, exception)));

    @Effect()
    shareGist$: Observable<Action> = this.actions$
        .ofType(GitHub.GitHubActionTypes.SHARE_PRIVATE_GIST, GitHub.GitHubActionTypes.SHARE_PUBLIC_GIST)
        .mergeMap(({ payload, type }) => {
            let { name, description } = payload;
            let files: IGistFiles = {};

            files[`${name}.yaml`] = {
                content: this._getShareableYaml(payload),
                language: 'yaml'
            };

            description = (description && description.trim() !== '') ? description + ' - ' : '';
            description.replace(Strings.gistDescriptionAppendage, ''); // shouldn't be necessary
            description += Strings.gistDescriptionAppendage;

            return this._github.createOrUpdateGist(
                `${description}`,
                files,
                null,
                type === GitHub.GitHubActionTypes.SHARE_PUBLIC_GIST
            );
        })
        .mergeMap(async (gist: IGist) => {
            let temp = `https://gist.github.com/${gist.owner.login}/${gist.id}`;
            let result = await this._uiEffects.alert(`${Strings.gistSharedDialogStart}

            ${temp}

${Strings.gistSharedDialogEnd}
`, Strings.gistSharedDialogTitle, Strings.gistSharedDialogViewButton, Strings.okButtonLabel); // the URL should be a hyperlink and the text should wrap

            if (result === Strings.gistSharedDialogViewButton) {
                window.open(temp);
            }

            return gist;
        })
        .mergeMap(gist => Observable.from([
            new GitHub.LoadGistsAction(),
            new GitHub.ShareSuccessAction(gist)
        ]))
        .catch(exception => Observable.from([
            new UI.ReportErrorAction(Strings.gistShareFailed, exception),
            new GitHub.ShareFailedAction()
        ]));

    @Effect({ dispatch: false })
    shareCopy$: Observable<Action> = this.actions$
        .ofType(GitHub.GitHubActionTypes.SHARE_COPY)
        .map(action => action.payload)
        .filter(snippet => !(snippet == null))
        .map((rawSnippet: ISnippet) => {
            const yaml = this._getShareableYaml(rawSnippet);
            AI.trackEvent(GitHub.GitHubActionTypes.SHARE_COPY, { id: rawSnippet.id });
            new clipboard('#CopyToClipboard', {
                text: () => {
                    this._uiEffects.alert(Strings.snippetCopiedConfirmation, null, Strings.okButtonLabel);
                    return yaml;
                }
            });
        })
        .catch(exception => Observable.of(this._createShowErrorAction(Strings.snippetCopiedFailed, exception)));


    @Effect({ dispatch: false })
    shareExport$: Observable<Action> = this.actions$
        .ofType(GitHub.GitHubActionTypes.SHARE_EXPORT)
        .map(action => action.payload)
        .filter(snippet => !(snippet == null))
        .map((snippet: ISnippet) => {
            AI.trackEvent('Share export initiated', { id: snippet.id });

            const additionalFields = this._getAdditionalShareableSnippetFields();
            const sanitizedFilenameBase =
                (snippet.name.toLowerCase()
                    .replace(/([^a-z0-9_]+)/gi, '-')
                    .replace(/-{2,}/g, '-') /* remove multiple consecutive dashes */
                    .replace(/(.*)-$/, '$1')
                    .replace(/^-(.*)/, '$1')
                ) || 'snippet';

            const exportData: IExportState = { snippet, additionalFields, sanitizedFilenameBase };

            this._http.post(
                environment.current.config.runnerUrl + '/export',
                { data: JSON.stringify(exportData) },
                { responseType: ResponseContentType.ArrayBuffer }
            ).toPromise()
                .then(res => {
                    const zipFilename = sanitizedFilenameBase +
                        '--' + moment().format('YYYY-MM-DD HH:mm:ss') + '.zip';

                    let blob = new Blob([res.arrayBuffer()], { type: 'application/zip' });
                    FileSaver.saveAs(blob, zipFilename);

                    AI.trackEvent('Share export succeeded', { id: snippet.id });
                })
                .catch(exception => {
                    this._store.dispatch(
                        this._createShowErrorAction(Strings.snippetExportFailed, exception));
                });
        })
        .catch(exception => {
            this._store.dispatch(this._createShowErrorAction(Strings.snippetExportFailed, exception));
            return null;
        });

    _getShareableYaml(rawSnippet: ISnippet): string {
        return getShareableYaml(rawSnippet, this._getAdditionalShareableSnippetFields());
    }

    _getAdditionalShareableSnippetFields(): ISnippet {
        const additionalFields: ISnippet = <any>{};

        if (this._github.profile) {
            additionalFields.author = this._github.profile.login;
        }
        additionalFields.api_set = {};

        return additionalFields;
    }

    _createShowErrorAction(message: string, exception) {
        console.log(exception);

        return new UI.ShowAlertAction({
            title: 'Error',
            message: message,
            actions: ['OK']
        });
    }
}

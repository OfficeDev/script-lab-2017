import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { PlaygroundError, AI, getShareableYaml, environment } from '../helpers';
import { Strings, getDisplayLanguage } from '../strings';
import { GitHubService } from '../services';
import { Store, Action } from '@ngrx/store';
import { UI, GitHub, Snippet } from '../actions';
import { Effect, Actions } from '@ngrx/effects';
import { Http, ResponseContentType } from '@angular/http';
import * as clipboard from 'clipboard';
import { UIEffects } from './ui';
import { find, isNil } from 'lodash';
import * as moment from 'moment';
import * as fromRoot from '../reducers';
import { Utilities, PlatformType } from '@microsoft/office-js-helpers';

const FileSaver = require('file-saver');
const UNKNOWN_GIST_OWNER_ID = '<unknown>'; // Intentional use of brackets that are not allowed in a GitHub ID (can only have alphanumeric characters)

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
        .switchMap(() => {
            return Observable
                .fromPromise(this._github.login())
                .map(profile => new GitHub.LoggedInAction(profile))
                .catch(exception => Observable.from([
                    new UI.ReportErrorAction(Strings().githubLoginFailed, exception),
                    new GitHub.LoginFailedAction()
                ]));
        });

    @Effect({ dispatch: false })
    logout$: Observable<Action> = this.actions$
        .ofType(GitHub.GitHubActionTypes.LOGGED_OUT)
        .map(() => this._github.logout())
        .catch(exception => Observable.of(new UI.ReportErrorAction(Strings().githubLogoutFailed, exception)));

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
        .catch(exception => Observable.of(new UI.ReportErrorAction(Strings().profileCheckFailed, exception)));

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
        .catch(exception => Observable.of(new UI.ReportErrorAction(Strings().gistRetrieveFailed, exception)));

    @Effect()
    shareGist$: Observable<Action> = this.actions$
        .ofType(
            GitHub.GitHubActionTypes.SHARE_PRIVATE_GIST,
            GitHub.GitHubActionTypes.SHARE_PUBLIC_GIST,
            GitHub.GitHubActionTypes.UPDATE_GIST
        )
        .mergeMap(action =>  {
            let { payload, type } = action;
            let { id, name, description, gist, gistOwnerId } = payload;
            let files: IGistFiles = {};
            let gistId = null;

            files[`${name}.yaml`] = {
                content: this._getShareableYaml(payload),
                language: 'yaml'
            };

            description = (description && description.trim() !== '') ? description + ' - ' : '';
            description.replace(Strings().gistDescriptionAppendage, ''); // shouldn't be necessary
            description += Strings().gistDescriptionAppendage;

            if (type === GitHub.GitHubActionTypes.UPDATE_GIST) {
                gistId = gist;
            }

            return (this._github.createOrUpdateGist(
                description, files, gistId, type === GitHub.GitHubActionTypes.SHARE_PUBLIC_GIST
            )
            .map((gist: IGist) => ({ type: type, gist: gist, snippetId: id }))
            .catch(exception => {
                if (!gistOwnerId && exception.status >= 400 && exception.status <= 499) {
                    throw new PlaygroundError(JSON.stringify({ type: type, snippetId: id, gistOwnerId: UNKNOWN_GIST_OWNER_ID }));
                }
                throw exception;
            }))
            .mergeMap(async ({ type, gist, snippetId }) => {
                let gistUrl = `https://gist.github.com/${gist.owner.login}/${gist.id}`;
                let messageBody =
                    type === GitHub.GitHubActionTypes.UPDATE_GIST ?
                        `${Strings().gistUpdateUrlIsSameAsBefore}\n\n${gistUrl}` :
                        `${Strings().gistSharedDialogStart}\n\n${gistUrl}\n\n${Strings().gistSharedDialogEnd}`;
                let messageTitle = type === GitHub.GitHubActionTypes.UPDATE_GIST ? Strings().gistUpdateSuccess : Strings().gistSharedDialogTitle;

                let result = await this._uiEffects.alert(messageBody, messageTitle, Strings().gistSharedDialogViewButton, Strings().okButtonLabel); // the URL should be a hyperlink and the text should wrap

                if (result === Strings().gistSharedDialogViewButton) {
                    window.open(gistUrl);
                }

                return { gist: gist, snippetId: snippetId };
            })
            .mergeMap(({ gist, snippetId }) => Observable.from([
                    new GitHub.LoadGistsAction(),
                    new GitHub.ShareSuccessAction(gist),
                    new Snippet.UpdateInfoAction({ id: snippetId, gist: gist.id, gistOwnerId: gist.owner.login })])
            )
            .catch(exception => {
                let actions: Action[] = [new GitHub.ShareFailedAction(exception)];
                if (exception instanceof PlaygroundError) {
                    try {
                        let message = JSON.parse(exception.message);
                        if (message.type === GitHub.GitHubActionTypes.UPDATE_GIST) {
                            actions.push(new Snippet.UpdateInfoAction({id: message.snippetId, gistOwnerId: message.gistOwnerId}));
                        }
                    } catch (e) {
                        return Observable.from(actions);
                    }
                }

                this._uiEffects.alert(
                    Strings().gistShareFailedBody + '\n\n' + Strings().reloadPrompt,
                    Strings().gistShareFailedTitle,
                    Strings().okButtonLabel);
                return Observable.from(actions);
            });
        });

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
                    return yaml;
                }
            }).on('success', async() => {
                await this._uiEffects.alert(Strings().snippetCopiedConfirmation, null, Strings().okButtonLabel);
                this._store.dispatch(new GitHub.ShareSuccessAction(null));
            });
        })
        .catch(exception => Observable.from([
            this._createShowErrorAction(Strings().snippetCopiedFailed, exception),
            new GitHub.ShareFailedAction(exception)
        ]));


    @Effect({ dispatch: false })
    shareExport$: Observable<Action> = this.actions$
        .ofType(GitHub.GitHubActionTypes.SHARE_EXPORT)
        .map(action => action.payload)
        .filter(snippet => !(snippet == null))
        .map((snippet: ISnippet) => {
            if (Utilities.platform === PlatformType.MAC || Utilities.platform === PlatformType.IOS) {
                AI.trackEvent('Unsupported share export', { id: snippet.id });
                this._store.dispatch(this._createShowErrorAction(Strings().snippetExportNotSupported, null));
                return;
            }

            AI.trackEvent('Share export initiated', { id: snippet.id });

            const additionalFields = this._getAdditionalShareableSnippetFields();
            const sanitizedFilenameBase =
                (snippet.name.toLowerCase()
                    .replace(/([^a-z0-9_]+)/gi, '-')
                    .replace(/-{2,}/g, '-') /* remove multiple consecutive dashes */
                    .replace(/(.*)-$/, '$1')
                    .replace(/^-(.*)/, '$1')
                ) || 'snippet';

            const exportData: IExportState = {
                snippet,
                additionalFields,
                sanitizedFilenameBase,
                displayLanguage: getDisplayLanguage()
            };

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
                        this._createShowErrorAction(Strings().snippetExportFailed, exception));
                });
        })
        .catch(exception => {
            this._store.dispatch(this._createShowErrorAction(Strings().snippetExportFailed, exception));
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
        if (!isNil(exception)) {
            console.log(exception);
        }

        return new UI.ShowAlertAction({
            title: 'Error',
            message: message,
            actions: ['OK']
        });
    }
}

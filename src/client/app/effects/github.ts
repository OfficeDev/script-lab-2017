import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { AI, Strings } from '../helpers';
import { GitHubService } from '../services';
import * as jsyaml from 'js-yaml';
import { Action } from '@ngrx/store';
import { UI, GitHub } from '../actions';
import { Effect, Actions } from '@ngrx/effects';
import * as clipboard from 'clipboard';
import { UIEffects } from './ui';
import { find } from 'lodash';
import { getScrubbedSnippet, SnippetFieldType } from './snippet';

@Injectable()
export class GitHubEffects {
    constructor(
        private actions$: Actions,
        private _github: GitHubService,
        private _uiEffects: UIEffects
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
        .filter(action => this._github.profile && action.payload)
        .mergeMap(({ rawSnippet, type }) => {
            const shareableSnippet = this._getShareableSnippet(rawSnippet);

            let { name, description } = shareableSnippet;
            let files: IGistFiles = {};

            files[`${name}.yaml`] = {
                content: jsyaml.safeDump(shareableSnippet),
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
            const shareable = this._getShareableSnippet(rawSnippet);
            AI.trackEvent(GitHub.GitHubActionTypes.SHARE_COPY, { id: shareable.id });
            new clipboard('#CopyToClipboard', {
                text: () => {
                    this._uiEffects.alert(Strings.snippetCopiedConfirmation, null, Strings.okButtonLabel);
                    return jsyaml.safeDump(shareable);
                }
            });
        })
        .catch(exception => Observable.of(new UI.ReportErrorAction(Strings.snippetCopiedFailed, exception)));

    _getShareableSnippet(rawSnippet: ISnippet): ISnippet {
        const snippet = getScrubbedSnippet(rawSnippet, SnippetFieldType.PUBLIC);
        if (this._github.profile) {
            snippet.author = this._github.profile.login;
        }
        return snippet;
    }
}

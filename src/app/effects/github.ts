import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { AI } from '../helpers';
import { GitHubService } from '../services';
import * as jsyaml from 'js-yaml';
import { Action } from '@ngrx/store';
import { UI, GitHub } from '../actions';
import { Effect, Actions } from '@ngrx/effects';
import * as clipboard from 'clipboard';
import { UIEffects } from './ui';
import find = require('lodash/find');

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
            new UI.ReportErrorAction('Failed to login to GitHub', exception),
            new GitHub.LoginFailedAction()
        ]));

    @Effect({ dispatch: false })
    logout$: Observable<Action> = this.actions$
        .ofType(GitHub.GitHubActionTypes.LOGGED_OUT)
        .map(() => this._github.logout())
        .catch(exception => Observable.of(new UI.ReportErrorAction('Failed to log out of GitHub', exception)));

    @Effect()
    isLoggedIn$: Observable<Action> = this.actions$
        .ofType(GitHub.GitHubActionTypes.IS_LOGGED_IN)
        .map(() => this._github.profile)
        .filter(profile => !(profile == null))
        .map(profile => new GitHub.LoggedInAction(profile))
        .catch(exception => Observable.of(new UI.ReportErrorAction('Failed to get GitHub profile', exception)));

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
        .catch(exception => Observable.of(new UI.ReportErrorAction('Failed to retrieve GitHub gists', exception)));

    @Effect()
    shareGist$: Observable<Action> = this.actions$
        .ofType(GitHub.GitHubActionTypes.SHARE_PRIVATE_GIST, GitHub.GitHubActionTypes.SHARE_PUBLIC_GIST)
        .filter(action => this._github.profile && action.payload)
        .mergeMap(({ payload, type }) => {
            let {name, description} = payload;
            let files: IGistFiles = {};
            payload.author = this._github.profile.login;

            files[`${name}.yaml`] = {
                content: jsyaml.safeDump(payload),
                language: 'yaml'
            };

            description = (description && description.trim() !== '') ? description + ' - ' : '';
            description.replace('Shared with Add-in Playground', '');
            description += 'Shared with Add-in Playground';

            return this._github.createOrUpdateGist(
                `${description}`,
                files,
                null,
                type === GitHub.GitHubActionTypes.SHARE_PUBLIC_GIST
            );
        })
        .mergeMap(async (gist: IGist) => {
            let temp = `https://gist.github.com/${gist.owner.login}/${gist.id}`;
            let result = await this._uiEffects.alert(`The URL of the GitHub Gist is

            ${temp}

You will be able to import your snippet by choosing the "Import" button in the Playground and providing the above URL.
`, 'Your snippet is shared', 'View on GitHub', 'OK');

            if (result === 'View on GitHub') {
                window.open(temp);
            }

            return gist;
        })
        .map(gist => new GitHub.ShareSuccessAction(gist))
        .catch(exception => Observable.from([
            new UI.ReportErrorAction('Failed to share a GitHub gist', exception),
            new GitHub.ShareFailedAction()
        ]));

    @Effect({ dispatch: false })
    shareCopy$: Observable<Action> = this.actions$
        .ofType(GitHub.GitHubActionTypes.SHARE_COPY)
        .map(action => action.payload)
        .filter(snippet => !(snippet == null))
        .map((snippet: ISnippet) => {
            if (this._github.profile) {
                snippet.author = this._github.profile.login;
            }
            AI.trackEvent(GitHub.GitHubActionTypes.SHARE_COPY, { id: snippet.id });
            new clipboard('#CopyToClipboard', {
                text: () => {
                    this._uiEffects.alert(`Your snippet has been copied.`, null, 'OK');
                    return jsyaml.safeDump(snippet);
                }
            });
        })
        .catch(exception => Observable.of(new UI.ReportErrorAction('Failed to copy the snippet to clipboard', exception)));
}

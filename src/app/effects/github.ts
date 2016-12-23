import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Utilities, Dictionary, Storage, StorageType } from '@microsoft/office-js-helpers';
import { Request, ResponseTypes, GitHubService } from '../services';
import * as _ from 'lodash';
import * as jsyaml from 'js-yaml';
import { Action } from '@ngrx/store';
import * as GitHub from '../actions/github';
import { Effect, Actions } from '@ngrx/effects';
import * as clipboard from 'clipboard';

@Injectable()
export class GitHubEffects {
    constructor(
        private actions$: Actions,
        private _github: GitHubService
    ) {
    }

    @Effect()
    login$: Observable<Action> = this.actions$
        .ofType(GitHub.GitHubActionTypes.LOGIN)
        .mergeMap(() => this._github.login())
        .map(profile => new GitHub.LoggedInAction(profile));

    @Effect({ dispatch: false })
    logout$: Observable<Action> = this.actions$
        .ofType(GitHub.GitHubActionTypes.LOGGED_OUT)
        .do(() => this._github.logout());

    @Effect()
    isLoggedIn$: Observable<Action> = this.actions$
        .ofType(GitHub.GitHubActionTypes.IS_LOGGED_IN)
        .map(() => this._github.profile)
        .filter<IBasicProfile, IBasicProfile>(profile => !(profile == null))
        .map(profile => new GitHub.LoggedInAction(profile));

    @Effect()
    loadGists$: Observable<Action> = this.actions$
        .ofType(GitHub.GitHubActionTypes.LOAD_GISTS)
        .mergeMap(() => this._github.gists())
        .map(gists => {
            return gists
                .map(gist => ({
                    id: gist.id,
                    description: gist.description,
                    file: _.find(gist.files, file => /\.ya?ml$/gi.test(file.filename))
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
        .map(snippets => new GitHub.LoadGistsSuccessAction(snippets));

    @Effect()
    shareGist$: Observable<Action> = this.actions$
        .ofType(GitHub.GitHubActionTypes.SHARE_PRIVATE_GIST, GitHub.GitHubActionTypes.SHARE_PUBLIC_GIST)
        .filter(action => this._github.profile && action.payload)
        .mergeMap(({ payload, type }) => {
            let {name, description} = payload;
            let files: IGistFiles = {};

            files[`${name}.yaml`] = {
                content: jsyaml.safeDump(payload),
                language: 'yaml'
            };

            return this._github.createOrUpdateGist(
                //TODO -- this is recurrsive....
                `${description} -- Shared with Add-in Playground`,
                files,
                null,
                type === GitHub.GitHubActionTypes.SHARE_PUBLIC_GIST
            )
                .catch(error => {
                    Utilities.log(error);
                    return null;
                });

        })
        .map(gist => new GitHub.ShareSuccessAction(gist));

    @Effect({ dispatch: false })
    shareCopy$: Observable<Action> = this.actions$
        .ofType(GitHub.GitHubActionTypes.SHARE_COPY)
        .map(action => action.payload)
        .filter(snippet => !(snippet == null))
        .do(snippet => {
            let copied = new clipboard('#CopyToClipboard', {
                text: trigger => jsyaml.safeDump(snippet)
            });

            // do cleanup here?
        });
}

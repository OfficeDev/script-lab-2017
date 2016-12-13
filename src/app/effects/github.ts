import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Utilities, Dictionary, Storage, StorageType } from '@microsoft/office-js-helpers';
import { Request, ResponseTypes, GitHubService } from '../services';
import * as _ from 'lodash';
import { Action } from '@ngrx/store';
import * as GitHub from '../actions/github';
import { Effect, Actions } from '@ngrx/effects';

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
        .mergeMap((action: GitHub.LoginAction) => this._github.login())
        .map(profile => new GitHub.LoggedInAction(profile));
}

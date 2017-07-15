import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Authenticator, IToken } from '@microsoft/office-js-helpers';
import { Request, ResponseTypes } from './request';
import { environment, storage } from '../helpers';

@Injectable()
export class GitHubService {
    private _baseUrl: string = 'https://api.github.com';
    private _authenticator: Authenticator;
    private _token: IToken;
    private _headers: any;

    constructor(private _request: Request) {
        let { clientId, tokenUrl } = environment.current.config;

        this._authenticator = new Authenticator();
        this._authenticator.endpoints.add('GitHub', {
            clientId: clientId,
            baseUrl: 'https://github.com/login',
            authorizeUrl: '/oauth/authorize',
            tokenUrl: `${tokenUrl}/${storage.user}`,
            scope: 'gist',
            state: true
        });

        this._token = this._authenticator.tokens.get('GitHub');
        this._setDefaultHeaders(this._token);
    }

    get profile(): IBasicProfile {
        return storage.current.profile;
    };

    user(): Observable<IBasicProfile> {
        return this._request.get<IBasicProfile>(`${this._baseUrl}/user`, ResponseTypes.JSON, this._headers);
    }

    orgs(user: string): Observable<IExtendedProfile[]> {
        return this._request.get<IExtendedProfile[]>(`${this._baseUrl}/users/${user}/orgs`, ResponseTypes.JSON, this._headers);
    }

    repos(org: string, personal: boolean, page: number = 0): Observable<IRepository[]> {
        let url = personal ?
            `${this._baseUrl}/user/repos?page=${page}&affiliation=owner,collaborator&sort=updated&direction=desc` :
            `${this._baseUrl}/orgs/${org}/repos?page=${page}`;

        return this._request.get<IRepository[]>(url, ResponseTypes.JSON, this._headers);
    }

    files(org: string, repo: string, branch: string, path?: string): Observable<IContents[]> {
        let url = `${this._baseUrl}/repos/${org}}/${repo}/contents`;
        if (!(path == null)) {
            url += `/${path}`;
        }
        return this._request.get<IContents[]>(url + `?ref=${branch}`, ResponseTypes.JSON, this._headers);
    }

    branches(org: string, repo: string): Observable<IBranch[]> {
        return this._request.get<IBranch[]>(`${this._baseUrl}/repos/${org}/${repo}/branches`, ResponseTypes.JSON, this._headers);
    }

    file(org: string, repo: string, branch: string, file: string): Observable<IContents> {
        return this._request.get<IContents>(`${this._baseUrl}/repos/${org}/${repo}/contents/${file}?ref=${branch}`, ResponseTypes.JSON, this._headers);
    }

    commits(org: string, repo: string, branch: string, file: string): Observable<ICommit[]> {
        return this._request.get<ICommit[]>(`${this._baseUrl}/repos/${org}/${repo}/commits?path=${file}&sha=${branch}&until=${(new Date().toISOString())}`, ResponseTypes.JSON, this._headers);
    }

    getSha(org: string, repo: string, branch: string, path?: string): Observable<IContents> {
        let url = `${this._baseUrl}/repos/${org}/${repo}/contents`;
        if (!(path == null)) {
            url += `/${path}`;
        }
        return this._request.get<IContents>(url + `?ref=${branch}`, ResponseTypes.JSON, this._headers);
    }

    createOrUpdate(org: string, repo: string, file: string, body: any): Observable<IUploadCommit> {
        return this._request.put<IUploadCommit>(`${this._baseUrl}/repos/${org}/${repo}/contents/${file}`, body, ResponseTypes.JSON, this._headers);
    }

    async login(): Promise<IBasicProfile> {
        this._token = await this._authenticator.authenticate('GitHub', environment.current.host === 'TEAMS');
        this._setDefaultHeaders(this._token);
        const profile = await this.user().toPromise();
        return profile;
    }

    logout() {
        this._authenticator.tokens.clear();
    }

    gists(): Observable<IGist[]> {
        if (this.profile == null) {
            return Observable.of([]);
        }
        let url = `${this._baseUrl}/users/${this.profile.login}/gists`;
        return this._request.get<IGist[]>(url, ResponseTypes.JSON, this._headers);
    }

    gist(id: string, sha?: string): Observable<IGist> {
        let url = `${this._baseUrl}/gists/${id}`;
        if (!(sha == null)) {
            url += `/${sha}`;
        }

        return this._request.get<IGist>(url, ResponseTypes.JSON, this._headers);
    }

    createOrUpdateGist(description: string, files: IGistFiles, id?: string, isPublic: boolean = true): Observable<IGist> {
        let body = {
            description: description,
            public: isPublic,
            files: files
        };

        let url = `${this._baseUrl}/gists`;
        if (!(id == null)) {
            url += `/${id}`;
            return this._request.patch<IGist>(url, body, ResponseTypes.JSON, this._headers);
        }

        return this._request.post<IGist>(url, body, ResponseTypes.JSON, this._headers);
    }

    forkGist(id: string): Observable<IGist> {
        return this._request.post<IGist>(`${this._baseUrl}/gists/${id}/forks`, undefined, ResponseTypes.JSON, this._headers);
    }

    deleteGist(id: string): Observable<{}> {
        return this._request.delete(`${this._baseUrl}/gists/${id}`, ResponseTypes.JSON, this._headers);
    }

    private _setDefaultHeaders(token?: IToken) {
        this._headers = {
            'Content-Type': 'application/json'
        };

        if (!(token == null)) {
            this._headers['Authorization'] = `Bearer ${token.access_token}`;
        }
    }
}

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Authenticator, Storage, IToken } from '@microsoft/office-js-helpers';
import { Request, ResponseTypes } from './request';
import * as _ from 'lodash';

@Injectable()
export class Github {
    private _baseUrl: string = 'https://api.github.com';
    private _profileStorage: Storage<IProfile>;
    private _authenticator: Authenticator;
    private _token: IToken;
    private _headers: any;

    constructor(private _request: Request) {
        this._profileStorage = new Storage<IProfile>('Profile');
        this._authenticator = new Authenticator();
        this._authenticator.endpoints.add('GitHub', {
            clientId: '53c1eb0d00a1ef6bf9ce',
            baseUrl: 'https://github.com/login',
            authorizeUrl: '/oauth/authorize',
            tokenUrl: 'https://markdowneditorforwordauth.azurewebsites.net/api/prod?code=oua1tkve93gx11hsk14avpldisyksksyqzc60dz6q3ia3sdcxrms7ofdt0njgug9u6ntlr6n7b9',
            scope: 'repo gist',
            state: true
        });

        this._token = this._authenticator.tokens.get('GitHub');
        this._setDefaultHeaders(this._token);
    }

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

    async login(): Promise<IProfile> {
        this._token = await this._authenticator.authenticate('GitHub');
        this._setDefaultHeaders(this._token);
        this.profile = await this.me();
        return this.profile;
    }

    async me() {
        let user = await this.user().toPromise();
        let orgs = await this.orgs(user.login).toPromise();
        return ({ orgs, user }) as IProfile;
    }

    logout() {
        this._authenticator.tokens.clear();
        this._profileStorage.clear();
    }

    gists(user?: string): Observable<IGist[]> {
        let url = user == null ? `${this._baseUrl}/gists` : `${this._baseUrl}/users/${user}/gists`;
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

    private _profile: IProfile;
    get profile(): IProfile {
        if (this._profile == null) {
            this._profile = _.first(this._profileStorage.values());

            if (this._profile == null) {
                this.login();
            }
        }

        return this._profile;
    }

    set profile(value: IProfile) {
        if (!(value == null)) {
            this._profile = value;
            this._profileStorage.add(this._profile.user.login, this.profile);
        }
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

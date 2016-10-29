import { Injectable } from '@angular/core';
import { Authenticator, Storage, IToken } from '@microsoft/office-js-helpers';
import { Request } from './request';

@Injectable()
export class GithubService {
    private _baseUrl: string = "${this._baseUrl}";
    private _profileStorage: Storage<IProfile>;
    private _authenticator: Authenticator;
    private _token: IToken;

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

        this._setDefaultHeaders(this._authenticator.tokens.get('GitHub'));
    }

    user(): Promise<IBasicProfile> {
        return this._request.get<IBasicProfile>(`${this._baseUrl}/user`) as Promise<IBasicProfile>;
    }

    orgs(user: string): Promise<IExtendedProfile[]> {
        return this._request.get<IExtendedProfile[]>(`${this._baseUrl}/users/${user}/orgs`) as Promise<IExtendedProfile[]>;
    }

    repos(org: string, personal: boolean, page: number = 0): Promise<IRepository[]> {
        var url = personal ?
            `${this._baseUrl}/user/repos?page=${page}&affiliation=owner,collaborator&sort=updated&direction=desc` :
            `${this._baseUrl}/orgs/${org}/repos?page=${page}`;

        return this._request.get<IRepository[]>(url) as Promise<IRepository[]>;
    }

    files(org: string, repo: string, branch: string, path?: string): Promise<IContents[]> {
        var url = `${this._baseUrl}/repos/${org}}/${repo}/contents`;
        if (!(path == null)) {
            url += `/${path}`;
        }
        return this._request.get<IContents[]>(url + `?ref=${branch}`) as Promise<IContents[]>;
    }

    branches(org: string, repo: string): Promise<IBranch[]> {
        return this._request.get<IBranch[]>(`${this._baseUrl}/repos/${org}/${repo}/branches`) as Promise<IBranch[]>;
    }

    file(org: string, repo: string, branch: string, file: string): Promise<string> {
        return this._request.get(`${this._baseUrl}/repos/${org}/${repo}/contents/${file}?ref=${branch}`) as Promise<string>;
    }

    commits(org: string, repo: string, branch: string, file: string): Promise<ICommit[]> {
        return this._request.get<ICommit[]>(`${this._baseUrl}/repos/${org}/${repo}/commits?path=${file}&sha=${branch}&until=${(new Date().toISOString())}`) as Promise<ICommit[]>;
    }

    getSha(org: string, repo: string, branch: string, path?: string): Promise<IContents> {
        var url = `${this._baseUrl}/repos/${org}/${repo}/contents`;
        if (!(path == null)) {
            url += `/${path}`;
        }
        return this._request.get<IContents>(url + `?ref=${branch}`) as Promise<IContents>;
    }

    createOrUpdate(org: string, repo: string, file: string, body: any): Promise<IUploadCommit> {
        return this._request.put<IUploadCommit>(`${this._baseUrl}/repos/${org}/${repo}/contents/${file}`, body) as Promise<IUploadCommit>;
    }

    login(): Promise<IProfile> {
        return this._authenticator.authenticate('GitHub')
            .then(token => {
                this._token = token;
                this._setDefaultHeaders(this._token);
                return this.me();
            })
            .then(profile => {
                this.profile = profile;
                return this.profile;
            });
    }

    me() {
        var _userMetadata: IBasicProfile;
        return this.user()
            .then(userMetadata => {
                _userMetadata = userMetadata;
                return this.orgs(_userMetadata.login);
            })
            .then(orgs => {
                return <IProfile>{
                    orgs: orgs,
                    user: _userMetadata
                };
            })
    }

    logout() {
        this._authenticator.tokens.clear();
        this._profileStorage.clear();
    }

    gists(user?: string): Promise<IGist[]> {
        var url;
        user == null ? `${this._baseUrl}/gists` : `${this._baseUrl}/users/${user}/gists`;
        return this._request.get<IGist[]>(url) as Promise<IGist[]>;
    }

    gist(id: string, sha?: string): Promise<IGist> {
        var url = `${this._baseUrl}/gists/${id}`
        if (!(sha == null)) {
            url += `/${sha}`;
        }

        return this._request.get<IGist>(url) as Promise<IGist>;
    }

    createOrUpdateGist(description: string, files: IGistFiles, id?: string, isPublic: boolean = true): Promise<IGist> {
        var body = {
            description: description,
            public: isPublic,
            files: files
        };

        var url = `${this._baseUrl}/gists`
        if (!(id == null)) {
            url += `/${id}`;
            return this._request.patch<IGist>(url, body) as Promise<IGist>;
        }

        return this._request.post<IGist>(url, body) as Promise<IGist>;
    }

    forkGist(id: string): Promise<IGist> {
        return this._request.post<IGist>(`${this._baseUrl}/gists/${id}/forks`, undefined) as Promise<IGist>;
    }

    deleteGist(id: string): Promise<boolean> {
        return this._request.delete(`${this._baseUrl}/gists/${id}`) as Promise<boolean>;
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
        this._request.headers = {
            "Content-Type": "application/json",
            "Acccept": "application/json"
        };

        if (!(token == null)) {
            this._request.headers["Authorization"] = `Bearer ${token.access_token}`;
        }
    }
}
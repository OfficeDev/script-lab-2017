import { Injectable } from '@angular/core';
import { Authenticator, Storage, IToken } from '@microsoft/office-js-helpers';
import { Request } from './request';

// export interface UserProfile {
//     user: GithubProfile,
//     orgs: GithubProfile[],
//     token: IToken
// }

@Injectable()
export class GithubService {
    private _baseUrl: string = "";
    private _profile: IUserProfile;
    private _profileStorage: Storage<IUserProfile>;
    private _authenticator: Authenticator;

    constructor(private _request: Request) {
        this._profileStorage = new Storage<IUserProfile>('Profile');
        this._authenticator = new Authenticator();
        this._authenticator.endpoints.add('GitHub', {
            clientId: '53c1eb0d00a1ef6bf9ce',
            baseUrl: 'https://github.com/login',
            authorizeUrl: '/oauth/authorize',
            tokenUrl: 'https://markdowneditorforwordauth.azurewebsites.net/api/prod?code=oua1tkve93gx11hsk14avpldisyksksyqzc60dz6q3ia3sdcxrms7ofdt0njgug9u6ntlr6n7b9',
            scope: 'repo',
            state: true
        });
    }

    user(): Observable<IProfileMetadata> {
        return this._request.get<IProfileMetadata>("https://api.github.com/user") as Observable<IProfileMetadata>;
    }

    orgs(username: string): Observable<IProfileMetadata[]> {
        return this._request.get<IProfileMetadata[]>("https://api.github.com/users/" + username + "/orgs") as Observable<IProfileMetadata[]>;
    }

    repos(page: number, orgName: string, personal: boolean): Observable<IRepository[]> {
        var url = personal ? "https://api.github.com/user/repos?page=" + page + "&affiliation=owner,collaborator&sort=updated&direction=desc" : "https://api.github.com/orgs/" + orgName + "/repos?page=" + page;
        return this._request.get<IRepository[]>(url) as Observable<IRepository[]>;
    }

    files(orgName: string, repoName: string, branchName: string, path?: string): Observable<IContents[]> {
        var url = "https://api.github.com/repos/" + orgName + "/" + repoName + "/contents";
        if (!Utilities.isNull(path)) { url += "/" + path; }
        return this._request.get<IContents[]>(url + "?ref=" + branchName) as Observable<IContents[]>;
    }

    branches(orgName: string, repoName: string): Observable<IBranch[]> {
        return this._request.get<IBranch[]>("https://api.github.com/repos/" + orgName + "/" + repoName + "/branches") as Observable<IBranch[]>;
    }

    file(orgName: string, repoName: string, branchName: string, filePath: string): Observable<string> {
        return this._request.getWithMediaHeaders<string>("https://api.github.com/repos/" + orgName + "/" + repoName + "/contents/" + filePath + "?ref=" + branchName) as Observable<string>;
    }

    commits(orgName: string, repoName: string, branchName: string, filePath: string): Observable<ICommit[]> {
        return this._request.get<ICommit[]>("https://api.github.com/repos/" + orgName + "/" + repoName + "/commits?path=" + filePath + "&sha=" + branchName + "&until=" + (new Date().toISOString())) as Observable<ICommit[]>;
    }

    getSha(orgName: string, repoName: string, branchName: string, path?: string): Observable<IContents> {
        var url = "https://api.github.com/repos/" + orgName + "/" + repoName + "/contents";
        if (!Utilities.isNull(path)) { url += "/" + path; }
        return this._request.get<IContents>(url + "?ref=" + branchName) as Observable<IContents>;
    }

    createFile(orgName: string, repoName: string, filePath: string, body: any): Observable<IUploadCommit> {
        return this._request.put<IUploadCommit>("https://api.github.com/repos/" + orgName + "/" + repoName + "/contents/" + filePath, body) as Observable<IUploadCommit>;
    }

    updateFile(orgName: string, repoName: string, filePath: string, body: any): Observable<IUploadCommit> {
        return this._request.put<IUploadCommit>("https://api.github.com/repos/" + orgName + "/" + repoName + "/contents/" + filePath, body) as Observable<IUploadCommit>;
    }

    uploadImage(orgName: string, repoName: string, fileName: string, body: any): Observable<IUploadCommit> {
        return this._request.put<IUploadCommit>("https://api.github.com/repos/" + orgName + "/" + repoName + "/contents/" + fileName, body) as Observable<IUploadCommit>;
    }

    getFileData(filename: string): Observable<string> {
        if (filename == null) return Observable.of('');
        return this._request.raw('assets/templates/' + filename + '.md') as Observable<string>;
    }

    login(): Promise<IUserProfile> {
        return this._authenticator.authenticate('GitHub')
            .then(token => this._getProfile(token))
            .then(profile => this.profile = profile);
    }

    logout() {
        Storage.clearAll();
    }

    get profile(): IUserProfile {
        if (Utilities.isEmpty(this._profile)) {
            this._profile = this._profileStorage.values()[0];

            if (!Utilities.isEmpty(this._profile)) {
                this._request.token(this._profile.token);
            }
        }

        return this._profile;
    }

    set profile(value: IUserProfile) {
        if (!Utilities.isEmpty(value)) {
            this._profile = value;
            this._profileStorage.insert(value.user.login, value);
        }
    }

    private _getProfile(token: IToken) {
        var _userMetadata: IProfileMetadata;
        this._request.token(token);
        return this.user().toPromise()
            .then(userMetadata => {
                _userMetadata = userMetadata;
                return this.orgs(_userMetadata.login).toPromise();
            })
            .then(orgs => {
                return {
                    token: token,
                    orgs: orgs,
                    user: _userMetadata
                };
            })
    }
}
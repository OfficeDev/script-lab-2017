interface IProfile {
    user: IBasicProfile,
    orgs: IBasicProfile[]
}

interface IBasicProfile {
    login?: string,
    id?: number,
    avatar_url?: string,
    gravatar_id?: string,
    html_url?: string,
    url?: string,
    type?: string,
    site_admin?: boolean
}

interface IExtendedProfile extends IBasicProfile {
    name?: string,
    company?: string,
    blog?: string,
    location?: string,
    email?: string,
    hireable?: string,
    bio?: string,
    public_repos?: number,
    public_gists?: number,
    followers?: number,
    following?: number,
    created_at?: Date,
    updated_at?: Date
}

interface IRepository {
    id?: number,
    name?: string,
    full_name?: string,
    owner: IBasicProfile,
    private?: boolean,
    html_url?: string,
    description?: string,
    fork?: boolean,
    url?: string,
    created_at?: Date,
    updated_at?: Date,
    pushed_at?: Date,
    homepage?: string
    size?: number,
    stargazers_count?: number,
    watchers_count?: number,
    language?: string,
    has_issues?: boolean,
    has_downloads?: boolean,
    has_wiki?: boolean,
    has_pages?: boolean,
    forks_count?: number,
    open_issues_count?: number,
    forks?: number,
    open_issues?: number,
    watchers?: number,
    default_branch?: string,
    permissions?: {
        admin?: boolean,
        push?: boolean,
        pull: boolean
    }
}

interface Owner extends IRepository {
    organization?: IBasicProfile,
    parent?: IRepository,
    source?: IRepository
}

interface IBranch {
    name?: string,
    protection?: {
        enabled?: boolean,
        required_status_checks?: {
            enforcement_level?: string,
            contexts: any[]
        }
    },
    commit?: ICommit,
    _links?: {
        html?: string,
        self?: string
    }
}

interface ICommit {
    sha?: string,
    commit?: {
        author?: {
            name?: string,
            date?: Date,
            email?: string
        },
        url?: string,
        message?: string,
        tree?: {
            sha?: string,
            url?: string
        },
        committer?: {
            name?: string,
            date?: Date,
            email?: string
        }
    },
    author?: {
        gravatar_id?: string,
        avatar_url?: string,
        url?: string,
        id?: number,
        login?: string
    },
    parents?: [
        {
            sha?: string,
            url?: string
        },
        {
            sha?: string,
            url?: string
        }
    ],
    url?: string,
    committer?: {
        gravatar_id?: string,
        avatar_url?: string,
        url?: string,
        id?: number,
        login?: string
    }
}

interface IContents {
    type?: string,
    size?: number,
    name?: string,
    path?: string,
    sha?: string,
    url?: string,
    git_url?: string,
    html_url?: string,
    content?: string,
    download_url?: string,
    _links?: {
        self?: string,
        git?: string,
        html?: string
    }
}

interface IUploadCommit {
    commit: ICommit,
    content: IContents
}

interface IGist {
    url?: string,
    forks_url?: string,
    commits_url?: string,
    id?: string,
    description?: string,
    public?: boolean,
    owner?: IBasicProfile,
    user?: any,
    files?: IGistFiles,
    truncated?: boolean,
    comments?: number,
    comments_url?: string,
    html_url?: string,
    git_pull_url?: string,
    git_push_url?: string,
    created_at?: string,
    updated_at?: string,
    forks?: [
        {
            user?: IBasicProfile,
            url?: string,
            id?: string,
            created_at?: string,
            updated_at?: string
        }
    ],
    history?: [
        {
            url?: string,
            version?: string,
            user?: IBasicProfile,
            change_status?: {
                deletions?: number,
                additions?: number,
                total?: number
            },
            committed_at?: string
        }
    ]
}

interface IGistFiles {
    [filename: string]: {
        filename?: string,
        size?: number,
        raw_url?: string,
        type?: string,
        language?: string,
        truncated?: boolean,
        content?: string
    }
}

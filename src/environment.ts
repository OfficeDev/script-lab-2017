declare let PLAYGROUND: any;

let { env, build, config } = PLAYGROUND;
let auth: {
    token_url: string;
    client_id: string;
} = config['cdn'];

if (env === 'DEVELOPMENT') {
    auth = config['dev'];
}
else {
    if (/azurewebsites.net/.test(location.origin)) {
        auth = config['prod'];
    }
}

const global = {
    env,
    build,
    auth
};

export default global;

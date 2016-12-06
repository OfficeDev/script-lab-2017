declare let PLAYGROUND: any;

interface IGlobalConfig {
    env: 'DEVELOPMENT' | 'PRODUCTION';
    build: {
        name: string;
        version: string;
        build: number;
        author: string;
        full_version: string;
    }
};

export const CONFIG: IGlobalConfig = PLAYGROUND;

interface IPackage {
    name: string,
    production?: string,
    main?: string,
    development?: string,
    defaultExtension?: string,
    version?: string
}

interface IBarrel {
    name: string,
    path: string
}

class Configuration {
    private map: SystemJSLoader.Config = {};
    private packages: SystemJSLoader.Config = {};
    private ngVersion = '@2.0.0-rc.4';
    private devMode = false;
    private imports = [];

    private angularPackages = <IPackage[]>[
        { name: 'common', version: this.ngVersion },
        { name: 'compiler', version: this.ngVersion },
        { name: 'core', version: this.ngVersion },
        { name: 'http', version: this.ngVersion },
        { name: 'platform-browser', version: this.ngVersion },
        { name: 'platform-browser-dynamic', version: this.ngVersion },
        { name: 'router', version: '@3.0.0-beta.2' },
        { name: 'testing', version: this.ngVersion }
    ];

    configure(entryScript: string) {
        System.config({
            map: this.map,
            packages: this.packages,
            meta: {
                'app/*': {
                    scriptLoad: true
                }
            }
        });

        return Promise.all(this.imports.map(pkgs => {
            return Array.isArray(pkgs) ? Promise.all(pkgs.map(pkg => System.import(pkg))) : System.import(pkgs);
        }))
            .then(() => System.import(entryScript))
            .then(() => console.log("All scripts have loaded"))
            .catch(console.error.bind(console));
    }

    import(pkgs: string | string[]) {
        this.imports.push(pkgs);
        return this;
    }

    useDevelopment() {
        console.info('Importing development libraries from node_modules.')
        this.devMode = true;
        return this;
    }

    useProduction() {
        console.info('Importing production libraries from CDNs.')
        this.devMode = false;
        return this;
    }

    registerBarrels(barrels: IBarrel[]) {
        barrels.forEach(barrel => {
            this.packages[barrel.name] = {
                main: 'index',
                defaultExtension: 'js'
            };

            this.map[barrel.name] = barrel.path + '/' + barrel.name;
        });

        return this;
    }

    registerLibraries(packages: IPackage[]) {
        packages.forEach(pkg => {
            this.packages[pkg.name] = {
                main: pkg.main || '',
                defaultExtension: pkg.defaultExtension || 'js'
            };

            pkg.production = pkg.production || 'https://npmcdn.com/' + pkg.name + '/' + pkg.main;
            this.map[pkg.name] = this.devMode ? pkg.development || pkg.production : pkg.production;
        });

        return this;
    }

    registerAngular2Packages() {
        var devModeFlag = true;

        this.angularPackages.forEach(pkg => {
            this.packages['@angular/' + pkg.name] = {
                main: 'bundles/' + pkg.name + '.umd.js',
                defaultExtension: 'js'
            };

            if (this.devMode) {
                if (devModeFlag) {
                    this.map['@angular'] = 'node_modules/@angular';
                    devModeFlag = false;
                }
            }
            else {
                this.map[pkg.name] = 'https://npmcdn.com/@angular/' + pkg.name + pkg.version + '/bundles/' + pkg.name + '.umd.min.js';
            }
        });

        return this;
    }
}

function useAppConfiguration() {
    var conf = new Configuration()
        .useDevelopment()
        .registerBarrels(<IBarrel[]>[
            {
                name: 'components',
                path: 'app'
            },
            {
                name: 'services',
                path: 'app/shared'
            },
            {
                name: 'helpers',
                path: 'app/shared'
            },
            {
                name: 'pipes',
                path: 'app/shared'
            }
        ])
        .registerAngular2Packages()
        .registerLibraries(<IPackage[]>[
            {
                name: 'app',
                main: 'bootstrap.js',
                production: 'app'
            },
            {
                name: 'rxjs',
                main: 'rx.umd.js',
                development: 'node_modules/rxjs'
            },
            {
                name: 'underscore',
                main: 'underscore-min.js',
                development: 'node_modules/underscore'
            },
            {
                name: 'jquery',
                main: 'jquery.min.js',
                development: 'node_modules/jquery/dist'
            }
        ])
        .import(['underscore', 'jquery'])
        .configure('app');
}

function useDialogConfiguration(initialScript: string) {
    var conf = new Configuration()
        .useDevelopment()
        .registerLibraries(<IPackage[]>[
            {
                name: 'app',
                main: 'bootstrap.js',
                development: 'app'
            },
            {
                name: 'underscore',
                main: 'underscore.js',
                development: 'node_modules/underscore'                
            },
            {
                name: 'jquery',
                main: 'jquery.min.js',
                development: 'node_modules/jquery/dist'
            },
        ])
        .import(['underscore', 'jquery'])
        .configure(initialScript);
}
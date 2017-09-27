const { dependencies } = require('../package.json');

function getVersionedPackageNames(packageNames) {
    let validNumericRegex = /^\d+\.\d+\.\d+.*$/;
    /*
        passes:
        2.3.4
        222.33.444
        1.1.2-private
        1.1.2-private.0

        fails:
        ^1.3.0
        2.2.*
    */

    let result = {};
    packageNames.forEach(item => {
        let versionNumberWithDots = dependencies[item];
        if (!validNumericRegex.test(versionNumberWithDots)) {
            throw new Error(`Package number for "${item}: ${versionNumberWithDots}" must start with a #.#.# format, ` +
                `pointing at a specific version.`);
        }

        let concatenated = item + '-' + versionNumberWithDots;
        let filesafeFolderName = concatenated.toLowerCase()
            .replace(/[^0-9a-zA-Z]/g, '-') /* replace any non-alphanumeric with a hyphen */
            .replace(/-+/g, '-') /* and ensure that don't end up with -- or --, just a single hyphen */
            .replace(/^-+/, '') /* trim any hyphens before */
            .replace(/-+$/, '') /* and trim any at the end, as well */;

        result[item] = filesafeFolderName;
    });
    return result;
}

class VersionedPackageSubstitutionsPlugin {
    constructor(packageNames) {
        this._packageNames = packageNames
    }

    apply(compiler) {
        compiler.plugin('compilation', (compilation) => {
            compilation.plugin('html-webpack-plugin-before-html-processing', (htmlPluginData, callback) => {
                let headOpeningTag = '<head>'; 
                let htmlHead = htmlPluginData.html.match(headOpeningTag);

                if (htmlHead && htmlHead.length > 0) {
                    htmlHead = htmlHead.index;
                    htmlPluginData.html = htmlPluginData.html.slice(0, htmlHead)
                        + headOpeningTag +
                        `
                        <script>
                            window.versionedPackageNames = ${JSON.stringify(this._packageNames)};
                        </script>
                        ` + 
                        htmlPluginData.html.slice(htmlHead + headOpeningTag.length);
                }

                htmlPluginData.html = htmlPluginData.html.replace(
                    /{{{versionedPackageNames\[['"](.+)['"]\]}}}/g,
                    (fullMatch, group1) => this._packageNames[group1]
                );

                callback(null, htmlPluginData);
            });
        });
    }
}

exports.getVersionedPackageNames = getVersionedPackageNames;
exports.VersionedPackageSubstitutionsPlugin = VersionedPackageSubstitutionsPlugin;

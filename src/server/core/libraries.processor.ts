////////////////////////////////////////////////////////////////////////////////////////////////////
/// NOTE: This file has multiple copies in different places, that should all
///       be synchronized whenever changes are made in one or the other.
///
///       * Script Lab: src/server/core/libraries.processor.ts
///       * Script Lab: src/client/app/helpers/libraries.processor.ts
///       * office-js-snippets repo: config/libraries.processor.ts"
///           (https://github.com/OfficeDev/office-js-snippets)
////////////////////////////////////////////////////////////////////////////////////////////////////

const officeJsRegex = /.*office(\.(experimental))?(\.debug)?\.js$/;
/* intentionally tests positive for any of the following:
    https://office.js
    https://office.debug.js
    https://office.experimental.js
    https://office.experimental.debug.js

  and intentionally returns false on:
    https://office.fooooo.debug.js
    https://officedebug.js
    https://officeydebug.js
*/

export function processLibraries(
  libraries: string,
  isMakerScript: boolean,
  isInsideOffice: boolean
) {
  let linkReferences: string[] = [];
  let scriptReferences: string[] = [];
  let officeJS: string = null;

  libraries.split('\n').forEach(processLibrary);

  if (isMakerScript && !isInsideOffice) {
    officeJS = '<none>';
  }

  return { linkReferences, scriptReferences, officeJS };

  function processLibrary(text: string) {
    if (text == null || text.trim() === '') {
      return null;
    }

    text = text.trim();

    let isNotScriptOrStyle =
      /^#.*|^\/\/.*|^\/\*.*|.*\*\/$.*/im.test(text) ||
      /^@types/.test(text) ||
      /^dt~/.test(text) ||
      /\.d\.ts$/i.test(text);

    if (isNotScriptOrStyle) {
      return null;
    }

    let resolvedUrlPath = /^https?:\/\/|^ftp? :\/\//i.test(text)
      ? text
      : `https://unpkg.com/${text}`;

    if (/\.css$/i.test(resolvedUrlPath)) {
      return linkReferences.push(resolvedUrlPath);
    }

    if (/\.ts$|\.js$/i.test(resolvedUrlPath)) {
      /*
       * Don't add Office.js to the rest of the script references --
       * it is special because of how it needs to be *outside* of the iframe,
       * whereas the rest of the script references need to be inside the iframe.
       */
      if (officeJsRegex.test(resolvedUrlPath.toLowerCase())) {
        officeJS = resolvedUrlPath;
        return null;
      }

      return scriptReferences.push(resolvedUrlPath);
    }

    return scriptReferences.push(resolvedUrlPath);
  }
}

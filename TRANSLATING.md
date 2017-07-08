# Translate Script Lab to other languages

This document describes how to create a new translation for Script Lab or improve an existing translation.

## Topics
* [Prerequisites](TRANSLATING.md#prerequisites)
* [Understanding the Script Lab structure for translating](TRANSLATING.md#structure)
* [Create a new translation](TRANSLATING.md/#create)
* [Improve an existing translation](TRANSLATING.md#improve)
* [Testing your translation](TRANSLATING.md#testing)
* [Script Lab languages](TRANSLATING.md/#translations)

<a id="prerequisites"></a>
## Prerequisites

Fork this project into your GitHub account and use branches to update existing files or add new files. When you are ready, create a pull request. Please note that, if you are not employed by Microsoft and you have never contributed to a Microsoft Project, you will be asked to sign the Microsoft Contribution License Agreement before your pull request is accepted.

We recommend you to download and install Visual Studio Code from here <https://code.visualstudio.com/> and follow the instructions from here [CONTRIBUTING.md](CONTRIBUTING.md) how to run the playground from source and having a local copy of the project. 

<a id="structure"></a>
## Understanding the Script Lab structure for translating

The Script Lab code is mainly composed of two parts: the server part and the client part. Each part has its own files to be modified and/or added for creating or improving a translation. Additionally, the project includes 4 manifest files which also include translatable strings.

Basically, the structure 

| Part      | Folder                   | Filename                  | Description                                              |
|:----------|:-------------------------|:--------------------------|:---------------------------------------------------------|
| Server    | `src/server/strings`     | `index.ts`                | Contains code to load the strings.                       |
| Server    | `src/server/strings`     | `english.ts`              | Contains the original strings in English.                |
| Server    | :                        | :                         | More files, one per language, including the translations.|
| Client    | `src/client/app/strings` | `index.ts`                | Contains code to load the strings.                       |
| Client    | `src/client/app/strings` | `english.ts`              | Contains the original strings in English.                |
| Client    | :                        | :                         | More files, one per language, including the translations.|
| Manifest  | `manifests`              | `script-lab-edge.xml`     | Manifest for the edge version.                           |
| Manifest  | `manifests`              | `script-lab-insiders.xml` | Manifest for the insider version.                        |
| Manifest  | `manifests`              | `script-lab-local.xml`    | Manifest for the locally installed version.              |
| Manifest  | `manifests`              | `script-lab-prod.xml`     | Manifest for the production version.                     |

<a id="create"></a>
## Create a new translation

### Server files

### Client files

### Manifests

<a id="improve"></a>
## Improve an existing translation

If you would like to improve an existing translation, e.g. correct a typing error or suggest a better wording, then just open the corresponding existing language files and do your changes. Please note, that if you would like to modify the manifest, you should do the change in all 4 files.

>Example: you discovered an error in the translation to *German* for the *client part*. Then open the file `german.ts` from the folder `src/client/app/strings` and do the change.

<a id="testing"></a>
## Testing your translation


<a id="translations"></a>
## Script Lab languages

Script Lab is currently available or being translated into the following languages:

| Language           | Code   | Status             | Production         | Notes              |
|:-------------------|:-------|:-------------------|:-------------------|:-------------------|
| English            | en     | Complete           | Yes                | Default language   |
| German             | de     | Complete           | No                 | -                  |

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

Fork this project into your GitHub account and use branches to update existing files or add new files. When you are ready, send us a pull request. Please note, that if you are not employed by Microsoft and you have not already signed the Microsoft Contribution License Agreement, you will be asked to sign the agreement before your pull request is accepted.

We recommend you to download and install Visual Studio Code from here <https://code.visualstudio.com/> and follow the instructions from here [CONTRIBUTING.md](CONTRIBUTING.md) how to run the playground from source and having a local copy of the project. 

<a id="structure"></a>
## Understanding the Script Lab structure for translating

The Script Lab code is mainly composed of two parts: the server part and the client part. Each part has its own files to be modified and/or added for creating or improving a translation. Additionally, the project includes 4 manifest files which also include translatable strings.

Basically, the structure is represented by the following table. For the server and client part, each translation is stored in separate files named to the corresponding language. For each manifest file, the translations are included in different sections of the file.

| Part      | Folder                   | Filename                  | Description                                    |
|:----------|:-------------------------|:--------------------------|:-----------------------------------------------|
| Server    | `src/server/strings`     | `index.ts`                | Contains code to load the strings.             |
| Server    | `src/server/strings`     | `english.ts`              | Contains the original strings in English.      |
| Server    | `src/server/strings`     | `german.ts`               | Contains the translated strings to German.     |
| Server    | `src/server/strings`     | :                         | More files, one per language.                  |
| Client    | `src/client/app/strings` | `index.ts`                | Contains code to load the strings.             |
| Client    | `src/client/app/strings` | `english.ts`              | Contains the original strings in English.      |
| Client    | `src/client/app/strings` | `german.ts`               | Contains the translated strings to German.     |
| Client    | `src/client/app/strings` | :                         | More files, one per language.                  |
| Manifest  | `manifests`              | `script-lab-edge.xml`     | Manifest for the edge version.                 |
| Manifest  | `manifests`              | `script-lab-insiders.xml` | Manifest for the insider version.              |
| Manifest  | `manifests`              | `script-lab-local.xml`    | Manifest for the locally installed version.    |
| Manifest  | `manifests`              | `script-lab-prod.xml`     | Manifest for the production version.           |

<a id="create"></a>
## Create a new translation

When creating a new translation, some steps must be done, before you can start to translate. 

The first step is to retrieve the official code for your language. You can refer to this list [Table of Language Culture Names](https://msdn.microsoft.com/de-de/library/ee825488(v=cs.20).aspx). You only need the first two letters of the mentionned codes. For example, for German the code is `de`, for French `fr` or for Spain `es`.

### Server part

Create a copy of the file `english.ts` from and to the folder `src/server/strings` and rename this copy to the language you are going to translate the strings. Please use the English name for your language. For example, if you are going to translate the strings into French, rename the file to `french.ts`. The filename must be in lower case letters.

Open the new file and change the word `English` of the function name `getEnglishStrings()` to the name of your language, where the first letter must be upper case. If we keep the example of creating a french translation, the function name would now be `getFrenchStrings()`.

Next step would be to tell the code, that a new language is available. For this open the file `index.ts` in the server part folder `src/server/strings`. You will have to add two lines to the code. If we keep our example for French again, the result will be similar to the code block shown below:

```ts
import { getEnglishStrings } from './english';
import { getGermanStrings } from './german';
import { getFrenchStrings } from './french';

const languageGenerator: { [key: string]: () => ServerStrings } = {
    'en': () => getEnglishStrings(),
    'de': () => getGermanStrings(),
    'fr': () => getFrenchStrings(),
    '??': () => createFakeStrings(() => getEnglishStrings())
};
```
In the code above, the new line `import { getFrenchStrings } from './french';` has been added to the already existing imports for English and German. The second new code line is `'fr': () => getFrenchStrings(),` - which has been added to the language generator.

That's all. Now you can start to translate your language file. Please note, that some strings include variables in their text. These variables look like `${Variable}` and should not be translated and also be preserved in your translation.

### Client part

Creating a translation for the client part is very similar to the translation for the server part. 

Create a copy of the file `english.ts` from and to the folder `src/client/app/strings` and rename this copy to your language, like you did for the server part. Open the new file and rename the `getEnglishStrings()` to the same function name, you used in the server part. 

Then open the file `index.ts` in the client part folder `src/client/app/strings` and - in this case - add three lines of code. If we keep our example of adding a french translation, the code will look similar to the following code block:

```ts
import { getEnglishStrings } from './english';
import { getGermanStrings } from './german';
import { getFrenchStrings } from './french';

let availableLanguages = [
    { name: 'English', value: 'en' },
    { name: 'Deutsch', value: 'de' },
    { name: 'Français', value: 'fr' }
];

const languageGenerator: { [key: string]: () => ClientStrings } = {
    'en': () => getEnglishStrings(),
    'de': () => getGermanStrings(),
    'fr': () => getFrenchStrings(),
    '??': () => createFakeStrings(() => getEnglishStrings())
};
```

Like for the server part, the two lines `import { getFrenchStrings } from './french';` and `'fr': () => getFrenchStrings(),` have been added to the code. Additionally add the new line  `{ name: 'Français', value: 'fr' }` after the last entry for the list of available languages. Please do not forget to add the comma at the end of previous line.

### Manifests

The translations of strings within the manifest files are addressed by the XML tag `override` and an indication of the country code. So, for translating just duplicate a line from another translation, set your country code and update the text.

Most translatable strings are located at the bottom of the XML files. An exception is the description of Script Lab, located on top of the XML file.

Here is an example, where the string *Help* has been translated to German and French.

```xml
  <bt:String id="PG.RunCommand.Title" DefaultValue="Help">
    <Override Locale="de" Value="Hilfe"/>
    <Override Locale="fr" Value="Aide"/>
  </bt:String>
```

<a id="improve"></a>
## Improve an existing translation

If you would like to improve an existing translation, e.g. correct a typing error or suggest a better wording, then just open the corresponding existing language files and do your changes. Please note, that when modifying one of the manifest files, you should also do the change in the 3 other files.

For example, if you discovered an error in the translation to *German* for the *client part*, then open the file `german.ts` from the folder `src/client/app/strings` and do the change.

<a id="testing"></a>
## Testing your translation

You should test your translations locally before pulling it to the original repository. Testing helps you to validate your translation and see how it looks in the application. And, for example, see if texts are too long and should be shortened.

For creating a testing environment, please refer to the instructions from here [CONTRIBUTING.md](CONTRIBUTING.md).

Script Lab recognizes the installed language of your Office App (Excel, Word, PowerPoint) and automatically selects a language. If this recognition fails, for what reason ever, Script Lab switches back to English. However, you can switch between languages by selecting the language in the About dialogue.

![About Script Lab in Dev Mode](.github/images/about-dev.png)

<a id="translations"></a>
## Script Lab languages

Script Lab is currently available or being translated into the following languages:

| Language           | Code   | Status             | Production         | Notes              |
|:-------------------|:-------|:-------------------|:-------------------|:-------------------|
| English            | en     | Complete           | Yes                | Default language   |
| German             | de     | Complete           | No                 | -                  |

export const sample = `# Please paste the Snippet URL or JSON into the text area below, and then choose the "Import" button.

# A URL for a Github Gist (https://gist.github.com/) that was exported by the Playground. For example:
# https://gist.github.com/{{sampleGistId}}


# A "View" URL created by the Playground. For example:
# https://addin-playground.azurewebsites.net/#/gist/{{sampleGistId}}


# A manually-pasted JSON that has been exported from an Playground snippet. For Example:

---
id: ''
gist: ''
author: ''
source: Web
name: New Snippet
description: |-
    Sample snippet to demonstrate the use of the Add-in Playground for Web.

script:
  language: typescript
  content: |-
    document.querySelector('#run').addEventListener('click', function () {
        getData().catch(OfficeHelpers.Utilities.log);
    });

    function getData() {
        let url = 'https://jsonplaceholder.typicode.com/posts/1';
        return fetch(url)
            .then(res => res.json())
            .then(data => console.log(data));
    }
`;

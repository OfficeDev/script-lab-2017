# Welcome to the Playground!
[![Build Status](https://travis-ci.com/OfficeDev/addin-playground.svg?token=zKp5xy2SuSortMzv5Pqc&branch=master)](https://travis-ci.com/OfficeDev/addin-playground)
[![PRODUCTION](https://img.shields.io/badge/PRODUCTION-bornholm-green.svg)](https://bornholm.azurewebsites.net)

## Noteworthy changes:

**Feb 4 2017:**
* Separate, synchronized runner!  This makes it absolutely delightful to work with the Playground, if I may say so myself.  Also, by doing an ajax-based request (thanks for convincing me of it, Bhargav), the refresh is near-instantaneous on a fast internet connection, as there is no need for page navigation.
* Errors (such as compile errors) are nicely displayed.  Before they returned a server 500 error, thereby failing to display.
* “Gallery” view (different than runner) offers ability to run different snippets, without having the editor open at all.
* Brand-new Playground ribbon tab, to house the functionality above, and also to give links to help articles, etc.
* Firebug console is cleaner (removed the tabs we weren’t or couldn’t be using).

## Issue

Any issues should be logged into the appropriate milestones at <https://github.com/OfficeDev/addin-playground/milestones>.  One bug (or group of related bugs) per issue.

# Test scenarios

* Create a snippet -- both "new" and from template
* Import someone else's snippet
  * From YAML
  * From Gist (incl. old-style)
  * From Non-GitHub URL (doesn't work yet, see issue #146)
* Run snippet, in both in-editor runner, side-by-side runner, and gallery, testing that:
  * Snippet renders correctly
  * Console log renders correctly (and scrolls correctly, if many lines)
  * Erroneous code (e.g, syntax error) shows error correctly
  * Running deleted snippet has reasonable behavior.
  * [Side-by-side runner]:
    * Edit to code causes runner want to refresh.
    * Whether starting from error or going to error state and back out, should act correctly.
* Sharing:
  * Copying to clipboard works
  * Can share as gist (**currently can't on EDGE environment, as it hasn't been configured for auth yet**)

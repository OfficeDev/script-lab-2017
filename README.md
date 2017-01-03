# This is a very early beta!

The basic flows should all work, but with some awkward moments.  Namely, you should be able to:
* Create => Edit => Run.
  * **Note that the initial view is read-only**, and you **must click save** before you can type into the text.*
  * Also note that **"Back" does not restore your view** to the correct snippet, you lose context.  Yes, it's super annoying.  Yes, we're fixing it (both via a routing fix courtesy of Bhargav, and a runner proof-of-concept coming from me).
* Switch between snippets.
* Editor IntelliSense.
* Ability to share.
* Ability to import from "clipboard-copied" YAML file or from GIST ID (both "new-style" gists and old).

Since the end-of-December release, we've also had the following imporvements:
* Runner and snippet code are isolated, in a way that ensures that scripts and CSS do not overlap with that of the body
* Runner now adopts the host header color
* Runner shows a loading progress

Any issues should be logged into the appropriate milestones at <https://github.com/OfficeDev/addin-playground/milestones>.  One bug (or group of related bugs) per issue.

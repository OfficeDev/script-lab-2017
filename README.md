# This is a very early beta!

The basic flows should all work, but with some awkward moments.  Namely, you should be able to:
* Create => Edit => Run.
  * ***Note that the initial view is read-only**, and you **must click save** before you can type into the text.*
  * Also note that **"Back" does not restore your view** to the correct snippet, you lose context.  Yes, it's super annoying.  Yes, we're fixing it (both via a routing fix courtesy of Bhargav, and a runner proof-of-concept coming from me).
* Switch between snippets.
* Editor IntelliSense
* Ability to import from previous "old-style" gist or from a "new-style" gist or YAML file.  And likewise, ability to share.

Any issues should be logged into the appropriate milestones at <https://github.com/OfficeDev/addin-playground/milestones>.  One bug (or group of related bugs) = one issue.

# This is a very early beta!

The basic flows should all work, but with some awkward moments.  Namely, you should be able to:
* Create => Edit => Run.
  * **Note that the initial view is read-only**, and you **must click save** before you can type into the text.*
  * Also note that **"Back" does not restore your view** to the correct snippet, you lose context.  Yes, it's super annoying.  Yes, we're fixing it (both via a routing fix courtesy of Bhargav, and a runner proof-of-concept coming from me).
* Switch between snippets.
* Editor IntelliSense.
* Ability to share.
* Ability to import from "clipboard-copied" YAML file (but currently broken for any URL import -- "new-style" gist or old, I'm assuming it's a super-simple fix, but it will need to wait on Bhargav (filed issue [#5](https://github.com/OfficeDev/addin-playground/issues/5)).

Any issues should be logged into the appropriate milestones at <https://github.com/OfficeDev/addin-playground/milestones>.  One bug (or group of related bugs) per issue.

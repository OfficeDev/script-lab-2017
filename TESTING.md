# Manual-testing scenarios

* Create a snippet -- both "new" and from a sample
  * There should be no Gist URL field when viewing the snippet's information
* Import someone else's snippet
  * From YAML
  * From Gist (incl. old-style)
  * From Non-GitHub URL **[Currently doesn't work, [Issue #146](https://github.com/OfficeDev/script-lab/issues/146)]**.
* Run snippet, in both in-editor runner (Office 2016 RTM and earlier, or online, or via tweaking the manifest to remove `command=true`) and via the "Run" button (`run.html`), testing that:
  * Snippet renders correctly
  * "Run" from editor or run gallery, in-place refresh, and full refresh all work correctly (render the snippet, don't double-refresh, etc.). The run (either type) doesn't show a "snippet needs reloading" message if the snippet is already fresh.
  * Console log renders correctly (and scrolls correctly, if many lines)
  * Erroneous code (e.g, syntax error) shows error correctly.
  * Running deleted snippet has reasonable behavior.
  * [Side-by-side runner]:
    * Edit to code causes runner want to refresh.
    * Whether starting from error or going to error state and back out, should act correctly.
  * Note: when running a script on localhost, you may see two compiler warnings for a critical dependency in the console log. These two warnings always appear in debug mode and are normal.
* Sharing:
  * Copying to clipboard works
  * Can share as gist, public and private
    * Gist URL should be updated in snippet information
  * Can update existing gist
  * Update option should not appear in share menu after importing a gist that you do not own
  * Update option appears in share menu after initial publish of a new gist or a gist that you did not previously own
  * Deleting a gist and then trying to update it via local copy should prompt full refresh
  
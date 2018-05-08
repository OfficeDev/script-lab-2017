# Custom Functions Dogfood

## Setup

### Prereq: Ensure you have the "DevMain Channel (Dogfood)"

Ensure that you are on **DevMain Channel (Dogfood)**, with build number **9325 or greater** (we're already into the 5-digit numbers now, so for most of you, that should already be the case). Note that for purposes of these instructions and the //build timeline, Script Lab will only support Custom Functions **on Windows Desktop**.

![Dogfood channel](./.github/images/dogfood-channel.png)

## Refresh the Store version of Script Lab

Until the Store version propagates and automatically updates on everyone's machine (I have an email thread out on that), please **remove Script Lab from "My Add-ins" and re-insert it again from the Store tab**.  This will ensure that you get the updated functionality.  If you now see a "Functions" button as the third button in the Script Lab tab in the ribbon, you know you've got the latest update!

## A picture is worth a thousand recalcs

![Screenshot](./.github/images/custom-functions-dogfood.png)
Custom Functions in action. Note the console.logs in the dashboard, as well!

## Usage

1.  Open the `Code` taskpane (via the Ribbon), create a new snippet, and replace the existing code with the following:

```typescript
/** @CustomFunction */
function sum(a: number, b: number): number {
  return a + b;
}
```

2.  Now choose the `Functions` ribbon button, to open the Custom Function dashboard appear. In a few seconds, the "Summary" tab should list the functions that you've registered.

3.  Enter `=SCRIPTLAB.{FULLFUNCTIONNAME}` into a cell within Excel (e.g., `=SCRIPTLAB.BLANKSNIPPET.ADD(5,7)`). Within moments, the result should appear right within the cell.

To try a more complicated (e.g., a web-service-calling) Custom Function, [import](http://aka.ms/scriptlab/import) this GitHub Gist: <https://gist.github.com/c8bbf1dd5c7fb33d5ea262e83e7df399>. Be sure to click "Trust" after importing.

## Friendly advice:

1.  Remember to add `/** @CustomFunction */` to any function you want registered.

1.  If you want to use `console.log`, do! It will show up in the "Console" tab of the Custom Functions dashboard.

1.  If you close and and re-open Excel, remember to re-register your custom functions.

## Troubleshooting

If for any reason your functions turn into `#GETTING_DATA` indefinitely, restart Excel. Hopefully this shouldn't be happening too often.

## Known issues

### Platform

1.  If you enter a Custom Function into a formula and then remove the function -- or if you restart Excel and before you re-register the custom functions -- the formula bar will show something like `=_xldudf_96323233322223(...)`
2.  Sometimes, you might get into a `#GETTING_DATA` state. This is a platform bug that *looks* like has been fixed, but hasn't made it to DevMain yet.

### Script Lab

No known issues at the moment (though note, for now the experience is for Windows only)

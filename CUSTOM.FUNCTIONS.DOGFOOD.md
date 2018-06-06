# Custom Functions Dogfood

## Setup

### Prereq: Ensure you are on an Office Insider build.

- Ensure that you are on an **[Office Insider](https://products.office.com/en-us/office-insider?tab=Windows-Desktop#Tabs_section)** build (a.k.a. **DevMain Channel (Dogfood)**)
- Also be sure that the build number is **9325 or greater**.  If you're already on a 5-digit build numbers, you're good to go!

Note that for purposes of these instructions and the //build timeline, Script Lab will only support Custom Functions **on Windows Desktop**.  And again, remember that you must be on an **Insider** build, the Custom Functions feature is not flighted for folks outside of Insiders!


![Dogfood channel](./.github/images/dogfood-channel.png)

## Acquire / Refresh the Store version of Script Lab

If you don't have Script Lab yet, [install it from Office Store](https://store.office.com/app.aspx?assetid=WA104380862)

If you have it, but don't see the "Functions" button in the ribbon when you open Excel, click on the "Edit" button in the Ribbon.  It should prompt you, letting you know that there is an update.

Once the update installs, you should see the refreshed ribbon, now with three buttons in the "Script" group.

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

If for any reason your functions turn into `#GETTING_DATA` indefinitely, restart Excel.  And please [file a bug](https://github.com/OfficeDev/script-lab/issues), describing what happened.

## Known issues

### Platform

1.  If you enter a Custom Function into a formula and then remove the function -- or if you restart Excel and before you re-register the custom functions -- the formula bar will show something like `=_xldudf_96323233322223(...)`

### Script Lab

No known issues at the moment (though note, for now the experience is for Windows only)

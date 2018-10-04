# Custom Functions Dogfood

## Setup

**Desktop:**
* Ensure that you are on an **[Office Insider](https://products.office.com/en-us/office-insider?tab=Windows-Desktop#Tabs_section)** build (a.k.a. **DevMain Channel (Dogfood)**).  The Custom Functions feature is not flighted for folks outside of Insiders!

**Office Online:**
- Should "just work".

**Mac:**
- Currently, there is **no support** for Script Lab + Custom Functions on the Mac

See the *known issues* section at the bottom of this document, for some caveats.

## A picture is worth a thousand recalcs

![Screenshot](./.github/images/custom-functions-dogfood.png)
Custom Functions in action. Note the console.logs in the dashboard, as well!

## Dogfood instructions

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

1.  If you want to use `console.log`, do!  On Office Online, it will show up in the "Console" tab of the Custom Functions dashboard.  On Desktop, it's currently *not supported*, but should be soon.

1.  If you close and and re-open Excel on Office Online, you will need to re-register your custom functions by opening the Custom Functions dashboard.  (There is an existing work item to persist them).  On Desktop, it should be persisted.

## Streaming functions:

All you need is to **specify a callback of type `CustomFunctions.StreamingHandler<X>` as the last parameter to a streaming function**. 

Simple case:  (from https://gist.github.com/Zlatkovsky/dd706c40431efabce962308789cba6f1)

```
/** @customfunction */
function increment(
    incrementBy: number,
    callback: CustomFunctions.StreamingHandler<number>
): void {
    let result = 0;
    const timer = setInterval(() => {
        result += incrementBy;
        callback.setResult(result);
    }, 1000);

    callback.onCanceled = () => {
        clearInterval(timer);
    };
}
```


More complicated (from https://gist.github.com/Zlatkovsky/522183067333a47d8ec4f7e8a4823c57)

```
/** @customfunction */
function stockPriceStream(ticker: string, handler: CustomFunctions.StreamingHandler<number>) {
    var updateFrequency = 10 /* milliseconds */;
    var isPending = false;

    var timer = setInterval(function () {
        // If there is already a pending request, skip this iteration:
        if (isPending) {
            return;
        }

        var url = "https://api.iextrading.com/1.0/stock/" + ticker + "/price";
        isPending = true;

        fetch(url)
            .then(function (response) {
                return response.text();
            })
            .then(function (text) {
                handler.setResult(parseFloat(text));
            })
            .catch(function (error) {
                handler.setResult(new Error(error) as any); // FIXME
            })
            .then(function () {
                isPending = false;
            });
    }, updateFrequency);

    handler.onCanceled = () => {
        clearInterval(timer);
    };
}
```



## Known issues

### Desktop:
1. No support for `console.log` on Desktop yet, or the bubbling-up of errors in general.  But it's coming soon.
2. No support for external libraries.  (Office Online will have those work, though).  But it's coming soon.

### Excel Online
1. You will need to re-open the Functions pane anytime you reload the page, in order to get the functions to re-register.

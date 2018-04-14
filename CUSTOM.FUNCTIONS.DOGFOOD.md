# Custom Functions Dogfood

## Setup

### Step 1: Remove Script Lab
![Remove Script Lab](./.github/images/remove-add-in.png)

### Step 2: Sideload Manifest
Instructions on how to sideload a manifest can be found [here](https://docs.microsoft.com/en-us/office/dev/add-ins/testing/create-a-network-shared-folder-catalog-for-task-pane-and-content-add-ins).

The manifest to sideload can be found [here](https://raw.githubusercontent.com/OfficeDev/script-lab/master/manifests/script-lab-prod.xml).

## Usage

Open the `Code` and `Functions` panes.

Create a new snippet, and replace the existing code with the following:

```typescript
/**
* Adds two numbers
* @param a - First number to add
* @param b - Second number to add
* @CustomFunction
*/
function sum(a: number, b: number): number {
    return a + b;
}
```

## Troubleshooting

**DO NOT CLOSE ANY OF THE PANES AFTER OPENING.**

There is currently a bug that will cause the custom functions runner to die if any of the panes are closed.

If for any reason your functions turn into `#GETTING_DATA` indefinitely, restart Excel.
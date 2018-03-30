// should pass matrix dimensionality tests

/**
 * *Insert Description here*
 * @CustomFunction
 */
function foo(a: number[][], b: number, c: number[][]): number[][] {
    return [[]];
}

// metadata
/*
[
  {
    "description": "*Insert Description here*",
    "helpUrl": "https://dev.office.com",
    "name": "foo",
    "options": {
      "cancelable": true,
      "stream": false,
      "sync": false,
      "volatile": false
    },
    "parameters": [
      {
        "dimensionality": "matrix",
        "name": "a",
        "type": "number"
      },
      {
        "dimensionality": "scalar",
        "name": "b",
        "type": "number"
      },
      {
        "dimensionality": "matrix",
        "name": "c",
        "type": "number"
      }
    ],
    "result": {
      "dimensionality": "matrix",
      "type": "number"
    }
  }
]
*/

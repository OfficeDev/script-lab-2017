// should pass basic tests

/**
* Adds two numbers
* @param a - First number to add
* @param b - Second number to add
* @CustomFunction
* @sync
*/
function sum(a: number, b: number): number {
    return a + b;
}

// not included
function sum2(a: number, b: number[]): number {
    return a + b[0];
}

// not included
function sum3(a: number, b: number): number {
    return a + b;
}

/**
* Adds numbers in array
* @param arr - array of numbers to add
* @CustomFunction
* @sync
* @stream
*/
function sumArr(arr: number[][]): number {
    return arr[0].reduce((accumulator, current) => accumulator + current);
}

/**
* Checks to see if a number is prime
* @CustomFunction
* @sync
* @stream
*/
function isPrime(num: number): boolean {
    return true;
}

// metadata
/*
[
   {
      "description":"Adds two numbers",
      "helpUrl":"https://dev.office.com",
      "name":"sum",
      "options":{
         "cancelable":true,
         "stream":false,
         "sync":true,
         "volatile":false
      },
      "parameters":[
         {
            "description":"First number to add",
            "dimensionality":"scalar",
            "name":"a",
            "type":"number"
         },
         {
            "description":"Second number to add",
            "dimensionality":"scalar",
            "name":"b",
            "type":"number"
         }
      ],
      "result":{
         "dimensionality":"scalar",
         "type":"number"
      }
   },
   {
      "description":"Adds numbers in array",
      "helpUrl":"https://dev.office.com",
      "name":"sumArr",
      "options":{
         "cancelable":true,
         "stream":true,
         "sync":true,
         "volatile":false
      },
      "parameters":[
         {
            "description":"array of numbers to add",
            "dimensionality":"matrix",
            "name":"arr",
            "type":"number"
         }
      ],
      "result":{
         "dimensionality":"scalar",
         "type":"number"
      }
   },
   {
      "description":"Checks to see if a number is prime",
      "helpUrl":"https://dev.office.com",
      "name":"isPrime",
      "options":{
         "cancelable":true,
         "stream":true,
         "sync":true,
         "volatile":false
      },
      "parameters":[
         {
            "dimensionality":"scalar",
            "name":"num",
            "type":"number"
         }
      ],
      "result":{
         "dimensionality":"scalar",
         "type":"boolean"
      }
   }
]
*/


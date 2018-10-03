// Copied from https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/custom-functions-runtime/index.d.ts
// Last updated:  Sept 24, 2018

declare namespace CustomFunctions {
  interface StreamingHandler<T> extends CancelableHandler {
    /**
     * Sets the returned result for a streaming custom function.
     * @beta
     */
    setResult: (value: T | Error) => void;
  }

  interface CancelableHandler {
    /**
     * Handles what should occur when a custom function is canceled.
     * @beta
     */
    onCanceled: () => void;
  }
}

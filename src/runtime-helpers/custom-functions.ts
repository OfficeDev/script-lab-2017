interface IStreamingCustomFunctionHandler<T> {
  setResult: (value: T) => void;
  onCanceled: () => void;
}

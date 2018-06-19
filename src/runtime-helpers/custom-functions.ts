interface IInvocationContext<T> {
  setResult: (value: T) => void;
  onCanceled: () => void;
}

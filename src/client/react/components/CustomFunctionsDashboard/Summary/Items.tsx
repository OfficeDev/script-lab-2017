export default interface Items {
  unsuccessful: {
    errors: InvalidItems[];
    skipped: InvalidItems[];
  };
  successful: string[];
}

interface InvalidItems {
  name: string;
  children: string[];
}

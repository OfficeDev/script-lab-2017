export default interface Items {
  unsuccessful: {
    errors: Invalid[];
    skipped: Invalid[];
  };
  successful: String[];
}

interface Invalid {
  name: String;
  children: String[];
}

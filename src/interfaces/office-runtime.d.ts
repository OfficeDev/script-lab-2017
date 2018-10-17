declare namespace OfficeRuntime {
  const AsyncStorage: AsyncStorage;

  interface AsyncStorage {
    getItem(
      key: string,
      callback?: (error?: Error, result?: string) => void
    ): Promise<string>;
    setItem(
      key: string,
      value: string,
      callback?: (error?: Error) => void
    ): Promise<void>;
    removeItem(key: string, callback?: (error?: Error) => void): Promise<void>;
    clear(callback?: (error?: Error) => void): Promise<void>;
    getAllKeys(callback?: (error?: Error, keys?: string[]) => void): Promise<string[]>;
    multiSet(
      keyValuePairs: string[][],
      callback?: (errors?: Error[]) => void
    ): Promise<void>;
    multiRemove(keys: string[], callback?: (errors?: Error[]) => void): Promise<void>;
    multiGet(
      keys: string[],
      callback?: (errors?: Error[], result?: string[][]) => void
    ): Promise<string[][]>;
  }
}

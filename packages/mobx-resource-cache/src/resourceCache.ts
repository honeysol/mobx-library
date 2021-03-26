import { demand, IDemand } from "mobx-demand";
interface IResourceCache<T> {
  get(key: string): T;
  has(key: string): boolean;
}

export const resourceCache = <T>({
  cleanUpFn,
  delay,
  generatorFn,
}: {
  cleanUpFn?: (value: T) => void;
  delay?: number;
  generatorFn: (key: string) => T;
}): IResourceCache<T> => {
  const map = new Map<string, IDemand<T>>();
  return {
    get(key: string): T {
      const item =
        map.get(key) ||
        (() => {
          const item = demand({
            cleanUpFn: (value: T) => {
              map.delete(key);
              cleanUpFn?.(value);
            },
            delay,
            name: key,
          })({ get: () => generatorFn(key) });
          map.set(key, item);
          return item;
        })();
      return item.get();
    },
    has(key: string): boolean {
      return map.has(key);
    },
  };
};

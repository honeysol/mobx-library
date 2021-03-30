import { demand } from "mobx-demand";
import { IMonitorRetained } from "mobx-monitor";
interface IResourceCache<T> {
  get(key: string): T;
  has(key: string): boolean;
}

export const resourceCache = <T>({
  cleanup,
  retentionTime,
  generatorFn,
  allowUntracked,
}: {
  cleanup?: (value: T) => void;
  retentionTime?: number;
  generatorFn: (key: string) => T;
  allowUntracked?: boolean;
}): IResourceCache<T> => {
  const map = new Map<string, IMonitorRetained<T>>();
  return {
    get(key: string): T {
      const item =
        map.get(key) ||
        (() => {
          const item = demand({
            cleanup: (value: T) => {
              map.delete(key);
              cleanup?.(value);
            },
            retentionTime,
            name: key,
            get: () => generatorFn(key),
            allowUntracked,
          });
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

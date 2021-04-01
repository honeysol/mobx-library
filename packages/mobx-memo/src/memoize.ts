import {
  createConversionAnnotation,
  ExtendedConversionAnnotation,
} from "mobx-annotation-manipulator";
import { demand } from "mobx-demand";
import type { IMonitorRetained } from "mobx-monitor";

import stringify from "./stringify";

const defaultSerializer = <A extends unknown[]>(...args: A) => stringify(args);

const _memoize = <AA extends unknown[], TT>({
  cleanup,
  retentionTime,
  serializer,
  allowUntracked,
}: {
  cleanup?: (value: TT) => void;
  retentionTime?: number;
  serializer?: (...args: AA) => string;
  allowUntracked?: boolean;
}) => <A extends AA, T extends TT>(
  get: (...args: A) => T
): ((...args: A) => T) => {
  const map = new Map<string, IMonitorRetained<T>>();
  const _serializer = serializer || defaultSerializer;
  return (...args: A): T => {
    const key = _serializer(...args);
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
          get: () => get(...args),
          allowUntracked,
        });
        map.set(key, item);
        return item;
      })();
    return item.get();
  };
};

export const memoize = <A extends unknown[], T>(params: {
  cleanup?: (value: T) => void;
  retentionTime?: number;
  serializer?: (...args: A) => string;
  allowUntracked?: boolean;
}): ExtendedConversionAnnotation<A, T> => {
  return createConversionAnnotation<A, T>(_memoize(params), {
    annotationType: "demand",
  });
};

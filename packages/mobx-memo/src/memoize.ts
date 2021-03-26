import {
  createConversionAnnotation,
  ExtendedConversionAnnotation,
} from "mobx-annotation-manipulator";
import { demand, IDemand } from "mobx-demand";

import stringify from "./stringify";

const defaultSerializer = <A extends unknown[]>(...args: A) => stringify(args);

const _memoize = <AA extends unknown[], TT>({
  cleanUpFn,
  delay,
  serializer,
}: {
  cleanUpFn?: (value: TT) => void;
  delay?: number;
  serializer?: (...args: AA) => string;
}) => <A extends AA, T extends TT>(
  generatorFn: (...args: A) => T
): ((...args: A) => T) => {
  const map = new Map<string, IDemand<T>>();
  const _serializer = serializer || defaultSerializer;
  return (...args: A): T => {
    const key = _serializer(...args);
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
        })({ get: () => generatorFn(...args) });
        map.set(key, item);
        return item;
      })();
    return item.get();
  };
};

export const memoize = <A extends unknown[], T>(params: {
  cleanUpFn?: (value: T) => void;
  delay?: number;
  serializer?: (...args: A) => string;
}): ExtendedConversionAnnotation<A, T> => {
  return createConversionAnnotation<A, T>(_memoize(params), {
    annotationType: "demand",
  });
};

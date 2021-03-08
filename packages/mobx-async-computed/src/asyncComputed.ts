import { observed } from "mobx-observed";
import { getDerivedPropertyKey } from "ts-decorator-manipulator";

import { AsyncCommitter } from "./asyncCommitter";

const getDescriptor = (propertyKey: string | symbol) => {
  return {
    get(this: any): any {
      return this[propertyKey];
    },
    set(this: any, value: any) {
      this[propertyKey] = value;
    },
  };
};
export const _asyncComputed = (options?: any) => (
  target: object,
  propertyKey: string | symbol,
  descriptor?: PropertyDescriptor
) => {
  descriptor = descriptor || getDescriptor(propertyKey);
  const asyncCommitterKey = getDerivedPropertyKey(
    propertyKey,
    "asyncCommitter"
  );
  return (observed.async({
    ...options,
    async change(this: any, { newValue }, setter) {
      const asyncCommiter = (this[asyncCommitterKey] =
        this[asyncCommitterKey] || new AsyncCommitter());
      const { successed, value } = await asyncCommiter.resolve(newValue);
      if (successed) {
        setter(value);
      }
    },
  })(target, propertyKey, descriptor) as any) as void;
};

export const asyncComputed = _asyncComputed();
export const asyncComputedFrom = (propertyKey: string) =>
  _asyncComputed({
    originalKey: propertyKey,
  });

export const asyncComputeTo = (propertyKey: string) =>
  _asyncComputed({
    resolvedKey: propertyKey,
  });

type ResolvedType<T extends Promise<any>> = T extends Promise<infer P>
  ? P
  : never;

export const resolveType = <T extends Promise<any>>(value: T) => {
  return (value as unknown) as ResolvedType<T>;
};

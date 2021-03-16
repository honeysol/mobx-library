import { computed } from "mobx";
import {
  createAnnotation,
  ExtendedAnnotation,
  observed,
  PropertyAccessor,
} from "mobx-observed";

import { AsyncCommitter } from "./asyncCommitter";

const asyncComputedPrimitive = <T>(options?: any) => (
  accessor?: PropertyAccessor<Promise<T> | undefined>,
  context?: any
): PropertyAccessor<T | undefined> => {
  if (!accessor?.get) {
    throw new Error("Accessor doesn't have get property");
  }
  const asyncCommiter = new AsyncCommitter<T>();
  return observed.async<Promise<T> | undefined, T | undefined>({
    ...options,
    async change({ newValue }, setter) {
      const { successed, value } = await asyncCommiter.resolve(newValue);
      if (successed) {
        setter(value);
      }
    },
  })(accessor, context) as PropertyAccessor<T>;
};

export const asyncComputedObject = <T>(options?: any) => (
  accessor?: PropertyAccessor<Promise<T> | undefined>
): PropertyAccessor<T | undefined> => {
  if (!accessor?.get) {
    throw new Error("Accessor doesn't have get property");
  }
  return asyncComputedPrimitive<T>(options)(computed(accessor.get));
};

export const asyncComputedFromObject = <T>(
  propertyKey: string | symbol,
  options?: any
) => (
  accessor?: PropertyAccessor<Promise<T> | undefined>,
  context?: any
): PropertyAccessor<T | undefined> => {
  if (accessor?.get) {
    console.error("Accessor have get property", accessor);
  }
  return asyncComputedPrimitive<T>(options)({
    get(this: any): Promise<T> | undefined {
      return context?.[propertyKey];
    },
  });
};

export const asyncComputedFrom = <T>(
  propertyKey: symbol | string,
  options?: any
): ExtendedAnnotation<Promise<T> | undefined, T | undefined> =>
  createAnnotation(asyncComputedFromObject<T>(propertyKey, options), {
    annotationType: "asyncComputedFrom",
  });

export const asyncComputed = createAnnotation(asyncComputedObject(), {
  annotationType: "asyncComputed",
});

type ResolvedType<T extends Promise<any>> = T extends Promise<infer P>
  ? P
  : never;

export const resolveType = <T extends Promise<any>>(
  value: T
): ResolvedType<T> => {
  return value as any;
};

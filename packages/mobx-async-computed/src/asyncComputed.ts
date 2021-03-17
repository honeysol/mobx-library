import { computed } from "mobx";
import {
  assert,
  createAnnotation,
  ExtendedAnnotation,
  PropertyAccessor,
} from "mobx-annotation-manipulator";
import { observed } from "mobx-observed";

import { AsyncCommitter } from "./asyncCommitter";

const asyncComputedPrimitive = <T>() => (
  accessor?: PropertyAccessor<Promise<T> | undefined>,
  context?: any
): PropertyAccessor<T | undefined> => {
  assert(accessor?.get, "Accessor doesn't have get property");
  const asyncCommiter = new AsyncCommitter<T>();
  return observed.async<Promise<T> | undefined, T | undefined>({
    async change({ newValue }, setter) {
      const { successed, value } = await asyncCommiter.resolve(newValue);
      if (successed) {
        setter(value);
      }
    },
  })(accessor, context) as PropertyAccessor<T>;
};

const asyncComputedObject = <T>() => (
  accessor?: PropertyAccessor<Promise<T> | undefined>
): PropertyAccessor<T | undefined> => {
  assert(accessor?.get, "Accessor doesn't have get property");
  return asyncComputedPrimitive<T>()(computed(accessor.get));
};

const asyncComputedFromObject = <T>(propertyKey: string | symbol) => (
  accessor?: PropertyAccessor<Promise<T> | undefined>,
  context?: any
): PropertyAccessor<T | undefined> => {
  assert(!accessor?.get, "Accessor have get property");
  return asyncComputedPrimitive<T>()({
    get(): Promise<T> | undefined {
      return context?.[propertyKey];
    },
  });
};

export const asyncComputedFrom = <T>(
  propertyKey: symbol | string
): ExtendedAnnotation<Promise<T> | undefined, T | undefined> =>
  createAnnotation(asyncComputedFromObject<T>(propertyKey), {
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

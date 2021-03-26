import { computed } from "mobx";
import {
  assert,
  createAsymmetricAnnotation,
  createPromiseAnnotation,
  ExtendedAsymmetricAnnotation,
  PropertyAccessor,
} from "mobx-annotation-manipulator";
import { observed } from "mobx-observed";

import { AsyncCommitter } from "./asyncCommitter";

const asyncComputedPrimitive = <T>(
  accessor?: PropertyAccessor<Promise<T | undefined> | T | undefined>,
  context?: any
): PropertyAccessor<T | undefined> => {
  assert(accessor?.get, "Accessor doesn't have get property");
  const asyncCommiter = new AsyncCommitter<T>();
  return observed.async<Promise<T | undefined> | undefined, T | undefined>({
    async change({ newValue }, setter) {
      const { successed, value } = await asyncCommiter.resolve(newValue);
      if (successed) {
        setter(value);
      }
    },
  })(accessor, context);
};

const asyncComputedObject = <T>(
  accessor?: PropertyAccessor<Promise<T | undefined> | T | undefined>
): PropertyAccessor<T | undefined> => {
  assert(accessor?.get, "Accessor doesn't have get property");
  return asyncComputedPrimitive<T>(computed(accessor.get));
};

const asyncComputedFromObject = <TT>(propertyKey: string | symbol) => <
  T extends TT
>(
  accessor?: PropertyAccessor<T | undefined>,
  context?: any
): PropertyAccessor<T | undefined> => {
  assert(!accessor?.get, "Accessor have get property");
  return asyncComputedPrimitive({
    get(): Promise<T | undefined> | T | undefined {
      return context?.[propertyKey];
    },
  });
};

export const asyncComputedFrom = <T>(
  propertyKey: symbol | string
): ExtendedAsymmetricAnnotation<unknown, T | undefined> =>
  createAsymmetricAnnotation<any, T | undefined>(
    asyncComputedFromObject<T>(propertyKey),
    {
      annotationType: "asyncComputedFrom",
    }
  );

export const asyncComputed = createPromiseAnnotation<unknown>(
  asyncComputedObject,
  {
    annotationType: "asyncComputed",
  }
);

type ResolvedType<T extends Promise<unknown>> = T extends Promise<infer P>
  ? P
  : never;

export const resolveType = <T extends Promise<unknown>>(
  value: T
): ResolvedType<T> => {
  return value as any;
};

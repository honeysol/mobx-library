import { computed } from "mobx";
import {
  assert,
  createAsymmetricAnnotation,
  createPromiseAnnotation,
  ExtendedAsymmetricAnnotation,
  PropertyAccessor,
} from "mobx-annotation-manipulator";

import { AsyncCommitter } from "./asyncCommitter";
import { projection } from "./projection";

const asyncComputedPrimitive = <T>(
  accessor?: PropertyAccessor<Promise<T | undefined> | T | undefined>,
  _context?: any
): PropertyAccessor<T | undefined> => {
  assert(accessor?.get, "Accessor doesn't have get property");
  const asyncCommiter = new AsyncCommitter<T>();
  return projection<Promise<T | undefined> | undefined | T, T | undefined>({
    async change({ newValue }, setter) {
      const { successed, value } = await asyncCommiter.resolve(newValue);
      if (successed) {
        setter(value);
      }
    },
    get() {
      return accessor.get();
    },
  });
};

const _asyncComputed = <T>(
  accessor?: PropertyAccessor<Promise<T | undefined> | T | undefined>
): PropertyAccessor<T | undefined> => {
  assert(accessor?.get, "Accessor doesn't have get property");
  return asyncComputedPrimitive<T>(computed(accessor.get));
};

const _asyncComputedFrom = <TT>(propertyKey: string | symbol) => <T extends TT>(
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
): ExtendedAsymmetricAnnotation<
  Promise<T | undefined> | T | undefined,
  T | undefined
> =>
  createAsymmetricAnnotation<any, T | undefined>(
    _asyncComputedFrom<T>(propertyKey),
    {
      annotationType: "asyncComputedFrom",
    }
  );

export const asyncComputed = createPromiseAnnotation<unknown>(_asyncComputed, {
  annotationType: "asyncComputed",
});

type ResolvedType<T extends Promise<unknown>> = T extends Promise<infer P>
  ? P
  : never;

export const resolveType = <T extends Promise<unknown>>(
  value: T
): ResolvedType<T> => {
  return value as any;
};

import { computed, createAtom, observable } from "mobx";

import {
  assert,
  createAnnotation,
  ExtendedAnnotation,
  PropertyAccessor,
} from "./util";

export const becomeObservedObject = <T>(
  handler: () => () => void | null,
  cancelHandler?: () => void
) => (accessor?: PropertyAccessor<T>, context?: any): PropertyAccessor<T> => {
  assert(accessor?.get, "accessor doesn't have get property", accessor);
  assert(typeof handler === "function", "handler not specified");
  let canceler: (() => void) | null = null;
  const atom = createAtom(
    accessor.debugName?.toString() || "",
    () => {
      canceler = handler.call(context);
    },
    () => {
      canceler?.();
      cancelHandler?.call(context);
    }
  );
  return {
    get(): T {
      atom.reportObserved();
      return accessor.get();
    },
    set(value: T) {
      accessor.set?.(value);
    },
  };
};

export const becomeObserved = <T>(
  handler: () => () => void | null,
  cancelHandler?: () => void
): ExtendedAnnotation<T, T> => {
  return createAnnotation<T, T>(becomeObservedObject(handler, cancelHandler), {
    annotationType: "becomeObserved",
  });
};

becomeObserved.observable = <T>(
  handler: () => () => void | null,
  cancelHandler?: () => void
) => {
  return createAnnotation<T, T>(
    (
      _accessor?: PropertyAccessor<unknown>,
      context?: any
    ): PropertyAccessor<T> => {
      assert(!_accessor?.get, "accessor have get property", _accessor);
      const accessor = observable.box(undefined as T | undefined, {
        deep: false,
      });
      return becomeObservedObject<T>(handler, cancelHandler)(accessor, context);
    },
    {
      annotationType: "becomeObserved",
    }
  );
};
becomeObserved.computed = <T>(
  handler: () => () => void | null,
  cancelHandler?: () => void
) => {
  return createAnnotation<T, T>(
    (accessor?: PropertyAccessor<T>, context?: any): PropertyAccessor<T> => {
      assert(accessor?.get, "accessor doesn't have get property", accessor);
      const computedAccessor = computed(accessor?.get);
      return becomeObservedObject<T>(handler, cancelHandler)(
        computedAccessor,
        context
      );
    },
    {
      annotationType: "becomeObserved",
    }
  );
};

import { computed, createAtom, observable } from "mobx";
import {
  assert,
  createSymmetricAnnotation,
  ExtendedSymmetricAnnotation,
  PropertyAccessor,
} from "mobx-annotation-manipulator";

export const becomeObservedObject = (
  handler: () => () => void | null,
  cancelHandler?: () => void
) => <T>(
  accessor?: PropertyAccessor<T>,
  context?: any
): PropertyAccessor<T> => {
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
): ExtendedSymmetricAnnotation<T> => {
  return createSymmetricAnnotation<T>(
    becomeObservedObject(handler, cancelHandler),
    {
      annotationType: "becomeObserved",
    }
  );
};

becomeObserved.observable = <TT>(
  handler: () => () => void | null,
  cancelHandler?: () => void
) => {
  return createSymmetricAnnotation<TT>(
    <T extends TT>(
      _accessor?: PropertyAccessor<T>,
      context?: any
    ): PropertyAccessor<T> => {
      assert(!_accessor?.get, "accessor have get property", _accessor);
      const accessor = observable.box(undefined as T | undefined, {
        deep: false,
      });
      return becomeObservedObject(handler, cancelHandler)(accessor, context);
    },
    {
      annotationType: "becomeObserved",
    }
  );
};
becomeObserved.computed = <TT>(
  handler: () => () => void | null,
  cancelHandler?: () => void
) => {
  return createSymmetricAnnotation<TT>(
    <T extends TT>(
      accessor?: PropertyAccessor<T>,
      context?: any
    ): PropertyAccessor<T> => {
      assert(accessor?.get, "accessor doesn't have get property", accessor);
      const computedAccessor = computed(accessor?.get);
      return becomeObservedObject(handler, cancelHandler)(
        computedAccessor,
        context
      );
    },
    {
      annotationType: "becomeObserved",
    }
  );
};

import { computed, createAtom, observable } from "mobx";

import { createAnnotation, ExtendedAnnotation, PropertyAccessor } from "./util";

export const becomeObservedObject = <T>(
  handler: () => () => void | null,
  cancelHandler?: () => void
) => (accessor?: PropertyAccessor<T>, context?: any): PropertyAccessor<T> => {
  if (!accessor?.get) {
    console.error(accessor);
    throw new Error("accessor doesn't have get property");
  }
  if (typeof handler !== "function") {
    console.error(handler);
    throw new Error("handler not specified");
  }
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
    get(this: any): T {
      atom.reportObserved();
      return accessor.get();
    },
    set(this: any, value: T) {
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
      const computedAccessor = computed(accessor!.get);
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

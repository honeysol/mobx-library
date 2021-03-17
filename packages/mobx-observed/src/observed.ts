import { action, computed, observable, reaction } from "mobx";
import {
  AnnotationFunction,
  assert,
  createAnnotation,
  PropertyAccessor,
} from "mobx-annotation-manipulator";

import { becomeObserved } from "./becomeObserved";

interface ObserveParams {
  change?: ({
    newValue,
    oldValue,
    type,
  }: {
    newValue?: any;
    oldValue?: any;
    type: "change";
  }) => void;
  enter?: ({ oldValue, type }: { oldValue?: any; type: "enter" }) => void;
  leave?: ({ oldValue, type }: { oldValue?: any; type: "leave" }) => void;
}

interface ObservAsyncParams<T, S> {
  change?: (
    {
      newValue,
      oldValue,
      type,
    }: { newValue?: T; oldValue?: T; type: "change" },
    setter: (value: S) => void
  ) => void;
  enter?: (
    { oldValue, type }: { oldValue?: T; type: "enter" },
    setter: (value: S) => void
  ) => void;
  leave?: (
    { oldValue, type }: { oldValue?: T; type: "leave" },
    setter: (value: S) => void
  ) => void;
}

const observedObject = <T>({
  change,
  enter,
  leave,
}: {
  change?: ({
    newValue,
    oldValue,
    type,
  }: {
    newValue?: any;
    oldValue?: any;
    type: "change";
  }) => void;
  enter?: ({ oldValue, type }: { oldValue?: any; type: "enter" }) => void;
  leave?: ({ oldValue, type }: { oldValue?: any; type: "leave" }) => void;
}) => (accessor?: PropertyAccessor<T>, context?: any): PropertyAccessor<T> => {
  assert(accessor?.get, "accessor doesn't have get property", accessor);
  const getter = () => accessor.get();
  const newDescriptor = becomeObserved<T>(
    function () {
      enter?.({ oldValue: getter(), type: "enter" });
      return () => {};
    },
    function () {
      leave?.({ oldValue: getter(), type: "leave" });
      return () => {};
    }
  )(accessor, context);
  return {
    set(value: any) {
      change?.({
        newValue: value,
        oldValue: newDescriptor.get?.(),
        type: "change",
      });
      newDescriptor.set?.(value);
    },
    get() {
      return newDescriptor.get?.();
    },
  };
};

const observedObjectAsync = <T, S>({
  change,
  enter,
  leave,
}: ObservAsyncParams<T, S>) => (
  accessor?: PropertyAccessor<T>,
  context?: any
): PropertyAccessor<S> => {
  assert(accessor?.get, "accessor doesn't have get property", accessor);
  const resolvedAccessor = observable.box(undefined as S | undefined, {
    deep: false,
  });
  return becomeObserved<S>(function (this: any) {
    const setter = action((value: S) => {
      resolvedAccessor.set?.(value);
    });
    const getter = () => accessor.get();
    enter?.call(this, { oldValue: getter(), type: "enter" }, setter);
    const cancelObserve = reaction(
      () => getter(),
      (newValue, oldValue) => {
        try {
          change?.call(this, { newValue, oldValue, type: "change" }, setter);
        } catch (e) {
          console.error(e);
        }
      },
      { fireImmediately: true }
    );
    return () => {
      cancelObserve();
      leave?.call(this, { oldValue: getter(), type: "leave" }, setter);
    };
  })(resolvedAccessor, context);
};

const observedObjectAsyncComputed = <T, S>({
  change,
  enter,
  leave,
}: ObservAsyncParams<T, S>) => (
  accessor?: PropertyAccessor<T>,
  context?: any
): PropertyAccessor<S> => {
  assert(accessor?.get, "accessor doesn't have get property", accessor);
  return observedObjectAsync<T, S>({
    change,
    enter,
    leave,
  })(computed(accessor.get), context);
};

const observedAutoclose = <T>(handler: (oldValue: T) => void) => {
  const wrappedHandler = ({
    oldValue,
    newValue,
  }: {
    oldValue?: any;
    newValue?: any;
  }) => {
    if (oldValue && oldValue !== newValue) {
      handler(oldValue);
    }
  };
  return observed<T>({ leave: wrappedHandler, change: wrappedHandler });
};

export const observed = <T>(param: ObserveParams): AnnotationFunction<T, T> => {
  return createAnnotation<T, T>(observedObject(param), {
    annotationType: "observed",
  });
};

const observedAsync = <T, S>(
  param: ObservAsyncParams<T, S>
): AnnotationFunction<T, S> => {
  return createAnnotation<T, S>(observedObjectAsync(param), {
    annotationType: "observed",
  });
};

observedAsync.computed = <T, S>(
  param: ObservAsyncParams<T, S>
): AnnotationFunction<T, S> => {
  return createAnnotation<T, S>(observedObjectAsyncComputed(param), {
    annotationType: "observed.async.computed",
  });
};

observed.async = observedAsync;

observed.computed = <T>(
  param: (oldValue: T) => void
): AnnotationFunction<T, T> => {
  return createAnnotation<T, T>(observedAutoclose(param), {
    annotationType: "observed.computed",
  });
};

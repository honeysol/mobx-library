import { action, computed, observable, reaction } from "mobx";

import { becomeObserved } from "./becomeObserved";
import { PropertyAccessor } from "./util";

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

export const observed = <T>({
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
}) => (accessor: PropertyAccessor<T>, context: any): PropertyAccessor<T> => {
  const getter = () => accessor.get();
  const newDescriptor = becomeObserved<T>(
    function (this: any) {
      enter?.({ oldValue: getter(), type: "enter" });
      return () => {};
    },
    function (this: any) {
      leave?.({ oldValue: getter(), type: "leave" });
      return () => {};
    }
  )(accessor, context);
  return {
    set(this: any, value: any) {
      change?.({
        newValue: value,
        oldValue: newDescriptor.get?.(),
        type: "change",
      });
      newDescriptor.set?.(value);
    },
    get(this: any) {
      return newDescriptor.get?.();
    },
  };
};

const observedAsync = <T, S>({
  change,
  enter,
  leave,
}: ObservAsyncParams<T, S>) => (
  accessor: PropertyAccessor<T>,
  context: any
): PropertyAccessor<S> => {
  if (!accessor.get) {
    console.error(accessor);
    throw new Error("accessor doesn't have get property");
  }
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

observedAsync.computed = <T, S>({
  change,
  enter,
  leave,
}: ObservAsyncParams<T, S>) => (
  accessor: PropertyAccessor<T>,
  context: any
): PropertyAccessor<S> => {
  return observedAsync<T, S>({
    change,
    enter,
    leave,
  })(computed(accessor.get), context);
};

observed.async = observedAsync;

observed.autoclose = (handler: (oldValue: any) => void) => {
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
  return observed({ leave: wrappedHandler, change: wrappedHandler });
};

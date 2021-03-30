import {
  action,
  computed,
  IReactionDisposer,
  observable,
  reaction,
} from "mobx";
import type { PropertyAccessor } from "mobx-annotation-manipulator";

import { monitor } from "./monitor";

interface MonitorAsyncParams<T, S> {
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
  get(): T;
}

export const monitorAsync = <T, S>({
  change,
  enter,
  leave,
  get,
}: MonitorAsyncParams<T, S>): PropertyAccessor<S> => {
  const resultAccessor = observable.box<S>(undefined, {
    deep: false,
  });
  const setter = action((value: S) => {
    resultAccessor.set?.(value);
  });
  let cancelObserve: IReactionDisposer | undefined = undefined;
  return monitor<S>({
    enter() {
      enter?.call(this, { oldValue: get(), type: "enter" }, setter);
      cancelObserve = reaction(
        () => get(),
        (newValue, oldValue) => {
          try {
            change?.call(this, { newValue, oldValue, type: "change" }, setter);
          } catch (e) {
            console.error(e);
          }
        },
        { fireImmediately: true }
      );
    },
    leave() {
      cancelObserve?.();
      leave?.call(this, { oldValue: get(), type: "leave" }, setter);
    },
    get() {
      return resultAccessor.get();
    },
  });
};

// compound annotations

export const monitorAsyncComputed = <T, S>({
  change,
  enter,
  leave,
  get,
}: MonitorAsyncParams<T, S>): PropertyAccessor<S> => {
  return monitorAsync<T, S>({
    change,
    enter,
    leave,
    get: computed(get).get,
  });
};

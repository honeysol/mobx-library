import { computed, observable, observe } from "mobx";

import { becomeObservedFor } from "./becomeObserved";
import { getDerivedPropertyKey, getDerivedPropertyString } from "./util";

/**
 * 
 * 
  class InternalImplementation{
    @computed
    [originalKey];
    @observable
    [resolvedKey];
    @becomeObservedFor(() => {
      do something
    }, "resolvedKey")
    [propertyKey];
  }
 */
export const observed = ({
  change,
  enter,
  leave,
}: {
  change?: (
    {
      newValue,
      oldValue,
      type,
    }: { newValue?: any; oldValue?: any; type: "change" },
    setter: (value: any) => void
  ) => void;
  enter?: (
    { oldValue, type }: { oldValue?: any; type: "enter" },
    setter: (value: any) => void
  ) => void;
  leave?: (
    { oldValue, type }: { oldValue?: any; type: "leave" },
    setter: (value: any) => void
  ) => void;
}) => (
  target: object,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor
) => {
  const resolvedKey = getDerivedPropertyKey(propertyKey, "resolved");
  const originalKey = getDerivedPropertyString(propertyKey, "original");
  Object.defineProperty(
    target,
    originalKey,
    computed(target, originalKey, {
      get: descriptor.get || descriptor.value,
    }) as any
  );

  Object.defineProperty(
    target,
    resolvedKey,
    observable.ref(target, resolvedKey, {
      configurable: true,
      writable: true,
      value: null,
    }) as any
  );

  return (becomeObservedFor<any>(function(this: any) {
    const setter = (value: any) => (this[resolvedKey] = value);
    enter?.({ oldValue: this[originalKey], type: "enter" }, setter);
    const cancelObserve = observe(
      this,
      originalKey,
      ({ newValue, oldValue }) => {
        change?.({ newValue, oldValue, type: "change" }, setter);
      },
      true
    );
    return () => {
      cancelObserve();
      leave?.({ oldValue: this[originalKey], type: "leave" }, setter);
    };
  }, resolvedKey) as any)(target, propertyKey);
};

observed.autoclose = (_handler: (oldValue: any) => void) => {
  const handler = (
    { oldValue, type }: { oldValue?: any; type: "change" | "leave" },
    setter: (value: any) => void
  ) => {
    if (oldValue) {
      _handler(oldValue);
    }
    if (type === "leave") {
      setter(null);
    }
  };
  return observed({ leave: handler, change: handler });
};

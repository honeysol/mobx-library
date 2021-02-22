import { computed, observable, observe } from "mobx";

import { becomeObservedFor } from "./becomeObserved";
import { getDerivedPropertyKey, getDerivedPropertyString } from "./util";

/**
 * 
 * 
  class InternalImplementation{
    @computed
    [originalFieldName];
    @observable
    [resolvedFieldName];
    @becomeObservedFor(() => {
      do something
    }, "resolvedFieldName")
    [fieldName];
  }
 */
export const demand = ({
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
  fieldName: string | symbol,
  descriptor: PropertyDescriptor
) => {
  const resolvedFieldName = getDerivedPropertyKey(fieldName, "resolved");
  const originalFieldName = getDerivedPropertyString(fieldName, "original");
  Object.defineProperty(
    target,
    originalFieldName,
    computed(target, originalFieldName, {
      get: descriptor.get || descriptor.value,
    }) as any
  );

  Object.defineProperty(
    target,
    resolvedFieldName,
    observable.ref(target, resolvedFieldName, {
      configurable: true,
      writable: true,
      value: null,
    }) as any
  );

  return (becomeObservedFor<any>(function(this: any) {
    const setter = (value: any) => (this[resolvedFieldName] = value);
    enter?.({ oldValue: this[originalFieldName], type: "enter" }, setter);
    const cancelObserve = observe(
      this,
      originalFieldName,
      ({ newValue, oldValue }) => {
        change?.({ newValue, oldValue, type: "change" }, setter);
      },
      true
    );
    return () => {
      cancelObserve();
      leave?.({ oldValue: this[originalFieldName], type: "leave" }, setter);
    };
  }, resolvedFieldName) as any)(target, fieldName);
};

demand.autoclose = (_handler: (oldValue: any) => void) => {
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
  return demand({ leave: handler, change: handler });
};

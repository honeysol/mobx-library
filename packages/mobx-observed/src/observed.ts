import { action, computed, observable, reaction } from "mobx";
import {
  getDerivedPropertyKey,
  getDerivedPropertyString,
} from "ts-decorator-manipulator";

import { becomeObservedFor } from "./becomeObserved";

/**
 * 
 * 
  class InternalImplementation{
    @computed
    [originalKey];
    @observable
    [resolvedKey];
    @becomeObservedFor("resolvedKey", () => {
      convert originalKey to resolvedKey
    })
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

  return (becomeObservedFor(resolvedKey, function(this: any) {
    const setter = action((value: any) => (this[resolvedKey] = value));
    const getter = () => this[originalKey];
    enter?.({ oldValue: this[originalKey], type: "enter" }, setter);
    const cancelObserve = reaction(
      () => getter(),
      (newValue, oldValue) => {
        change?.({ newValue, oldValue, type: "change" }, setter);
      }
    );
    return () => {
      cancelObserve();
      leave?.({ oldValue: this[originalKey], type: "leave" }, setter);
    };
  }) as any)(target, propertyKey);
};

observed.autoclose = (_handler: (oldValue: any) => void) => {
  const handler = (
    {
      oldValue,
      newValue,
      type,
    }: { oldValue?: any; newValue?: any; type: "change" | "leave" },
    setter: (value: any) => void
  ) => {
    if (oldValue) {
      _handler(oldValue);
    }
    setter(type === "leave" ? null : newValue);
  };
  return observed({ leave: handler, change: handler });
};

import { action, computed, observable, reaction } from "mobx";
import {
  getDerivedPropertyKey,
  getDerivedPropertyString,
} from "ts-decorator-manipulator";

import { becomeObservedFor } from "./becomeObserved";
const noopDecorator = (
  target: object,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor
) => descriptor;

export const observedFor = (
  observedKey: string | symbol,
  {
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
  }
) => (target: object, propertyKey: string | symbol) => {
  const descriptor = becomeObservedFor(
    observedKey,
    function(this: any) {
      enter?.({ oldValue: descriptor.get?.call(this), type: "enter" });
      return () => {};
    },
    function(this: any) {
      leave?.({ oldValue: descriptor.get?.call(this), type: "leave" });
      return () => {};
    }
  )(target, propertyKey);
  return {
    set(this: any, value: any) {
      change?.({
        newValue: value,
        oldValue: descriptor.get?.call(this),
        type: "change",
      });
      descriptor.set?.call(this, value);
    },
    get(this: any) {
      return descriptor.get?.call(this);
    },
  };
};

export const observed = (
  handlers: {
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
  },
  decorator: MethodDecorator = noopDecorator
) => (
  target: object,
  propertyKey: string | symbol,
  descriptor?: PropertyDescriptor
) => {
  const originalKey = getDerivedPropertyString(
    propertyKey,
    "original(becomeObserved)"
  );
  Object.defineProperty(
    target,
    originalKey,
    (decorator(
      target,
      originalKey,
      descriptor as any
    ) as unknown) as MethodDecorator
  );
  return (observedFor(originalKey, handlers)(
    target,
    propertyKey
  ) as unknown) as void;
};

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
observed.async = ({
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
      },
      { fireImmediately: true }
    );
    return () => {
      cancelObserve();
      leave?.({ oldValue: this[originalKey], type: "leave" }, setter);
    };
  }) as any)(target, propertyKey);
};

observed.autoclose = (_handler: (oldValue: any) => void) => {
  const handler = ({ oldValue }: { oldValue?: any }) => {
    if (oldValue) {
      _handler(oldValue);
    }
  };
  return observed({ leave: handler, change: handler });
};

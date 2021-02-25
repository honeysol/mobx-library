import { action, computed, observable, reaction } from "mobx";
import { evacuate } from "ts-decorator-manipulator";

import { becomeObserved } from "./becomeObserved";

export const observed = ({
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
}) => (
  target: object,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor
) => {
  const newDescriptor = becomeObserved(
    function(this: any) {
      enter?.({ oldValue: descriptor.get?.call(this), type: "enter" });
      return () => {};
    },
    function(this: any) {
      leave?.({ oldValue: descriptor.get?.call(this), type: "leave" });
      return () => {};
    }
  )(target, propertyKey, descriptor);
  return {
    set(this: any, value: any) {
      change?.({
        newValue: value,
        oldValue: newDescriptor.get?.call(this),
        type: "change",
      });
      newDescriptor.set?.call(this, value);
    },
    get(this: any) {
      return newDescriptor.get?.call(this);
    },
  };
};

/**
 * 
 * 
  class InternalImplementation{
    @computed
    [originalKey];
    @observable
    [resolvedKey];
    @becomeObserved(handlers)
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
  const originalDescriptor = evacuate(computed, "original")(
    target,
    propertyKey,
    {
      get: descriptor.get || descriptor.value,
    }
  );
  const resolvedDescriptor = evacuate(observable.ref, "resolved")(
    target,
    propertyKey
  );
  return becomeObserved(function(this: any) {
    const setter = action((value: any) => {
      resolvedDescriptor.set?.call(this, value);
    });
    const getter = () => originalDescriptor.get?.call(this);
    enter?.({ oldValue: getter(), type: "enter" }, setter);
    const cancelObserve = reaction(
      () => getter(),
      (newValue, oldValue) => {
        change?.({ newValue, oldValue, type: "change" }, setter);
      },
      { fireImmediately: true }
    );
    return () => {
      cancelObserve();
      leave?.({ oldValue: getter(), type: "leave" }, setter);
    };
  })(target, propertyKey, resolvedDescriptor);
};

observed.autoclose = (_handler: (oldValue: any) => void) => {
  const handler = ({ oldValue }: { oldValue?: any }) => {
    if (oldValue) {
      _handler(oldValue);
    }
  };
  return observed({ leave: handler, change: handler });
};

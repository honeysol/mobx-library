import { computed, intercept as mobxIntercept } from "mobx";
import { getDerivedPropertyKey } from "ts-decorator-manipulator";

import { addHandler } from "./component";

export const intercept = (
  handler: ({ newValue, oldValue }: { newValue?: any; oldValue?: any }) => any,
  closeHandler?: ({ oldValue }: { oldValue: any }) => void
): MethodDecorator => (
  target: object,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor
) => {
  const cancelObserveKey = getDerivedPropertyKey(propertyKey, "cancelObserve");
  addHandler(target, "init", function(this: any) {
    this[cancelObserveKey] = mobxIntercept(
      this,
      propertyKey,
      handler.bind(this)
    );
  });
  addHandler(target, "release", function(this: any) {
    this[cancelObserveKey]();
    closeHandler?.({ oldValue: this[propertyKey] });
  });
  return descriptor;
};

// mobのinterceptは、computedには使えない。
// computedにも使えるような独自実装。
const interceptComputed = (
  handler: ({ newValue, oldValue }: { newValue?: any; oldValue?: any }) => any,
  closeHandler?: ({ oldValue }: { oldValue: any }) => void
) => (
  target: object,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor
) => {
  const originalKey = getDerivedPropertyKey(propertyKey, "original");

  if (closeHandler) {
    addHandler(target, "release", function(this: any) {
      closeHandler?.({ oldValue: this[originalKey] });
    });
  }
  return computed(target, propertyKey, {
    get(this: any) {
      const newValue = descriptor.get?.apply(this);
      const oldValue = this[originalKey];
      if (handler.call(this, { newValue, oldValue })) {
        this[originalKey] = newValue;
      }
      return this[originalKey];
    },
  });
};

// observed.autocloseが、unobservedで呼ばれるのと異なり、
// intercept.computed.autoclose, intercept.autoclose
// は、React.componentが破棄されるタイミングで呼ばれる
// 値の更新ではいずれでも呼ばれる
interceptComputed.autoclose = (handler: (value: any) => void) => {
  const wrappedHandler = ({ oldValue }: { oldValue?: any }) => {
    if (oldValue) {
      handler(oldValue);
    }
    return true;
  };
  return interceptComputed(wrappedHandler, wrappedHandler);
};

intercept.autoclose = (handler: (value: any) => void) => {
  const wrappedHandler = ({ oldValue }: { oldValue?: any }) => {
    if (oldValue) {
      handler(oldValue);
    }
    return true;
  };
  return intercept(wrappedHandler, wrappedHandler);
};

intercept.computed = interceptComputed;

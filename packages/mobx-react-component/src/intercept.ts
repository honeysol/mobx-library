import { computed, intercept as mobxIntercept } from "mobx";
import { addHandler } from "mobx-initializer";

import { getDerivedPropertyKey } from "./util";

export const intercept = (
  handler: ({ newValue, oldValue }: { newValue?: any; oldValue?: any }) => any,
  closeHandler?: ({ oldValue }: { oldValue: any }) => void
): MethodDecorator => (
  target: object,
  fieldName: string | symbol,
  descriptor: PropertyDescriptor
) => {
  const cancelObserveFieldName = getDerivedPropertyKey(
    fieldName,
    "cancelObserve"
  );
  addHandler(target, "init", function(this: any) {
    this[cancelObserveFieldName] = mobxIntercept(
      this,
      fieldName,
      handler.bind(this)
    );
  });
  addHandler(target, "release", function(this: any) {
    this[cancelObserveFieldName]();
    closeHandler?.({ oldValue: this[fieldName] });
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
  fieldName: string | symbol,
  descriptor: PropertyDescriptor
) => {
  const originalFieldName = getDerivedPropertyKey(fieldName, "original");

  if (closeHandler) {
    addHandler(target, "release", function(this: any) {
      closeHandler?.({ oldValue: this[originalFieldName] });
    });
  }
  return computed(target, fieldName, {
    get(this: any) {
      const newValue = descriptor.get?.apply(this);
      const oldValue = this[originalFieldName];
      if (handler.call(this, { newValue, oldValue })) {
        this[originalFieldName] = newValue;
      }
      return this[originalFieldName];
    },
  });
};

// demand.autocloseが、unobservedで呼ばれるのと異なり、
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

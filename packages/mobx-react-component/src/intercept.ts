import { computed, intercept as mobxIntercept } from "mobx";
import { addHandler } from "mobx-initializer";

export const intercept = (
  handler: ({ newValue, oldValue }: { newValue?: any; oldValue?: any }) => any,
  closeHandler?: ({ oldValue }: { oldValue: any }) => void
): MethodDecorator => (
  target: object,
  fieldName: string | symbol,
  descriptor: PropertyDescriptor
) => {
  const cancelObserveFieldname = Symbol(
    "cancelObserveFieldname: " + fieldName.toString()
  );
  addHandler(target, "init", function(this: any) {
    this[cancelObserveFieldname] = mobxIntercept(
      this,
      fieldName,
      handler.bind(this)
    );
  });
  addHandler(target, "release", function(this: any) {
    this[cancelObserveFieldname]();
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
  const temporaryFieldName = Symbol(
    "temporaryFieldName: " + fieldName.toString()
  );
  if (closeHandler) {
    addHandler(target, "release", function(this: any) {
      closeHandler?.({ oldValue: this[temporaryFieldName] });
    });
  }
  return computed(target, fieldName, {
    get(this: any) {
      const newValue = descriptor.get?.apply(this);
      const oldValue = this[temporaryFieldName];
      if (handler.call(this, { newValue, oldValue })) {
        this[temporaryFieldName] = newValue;
      }
      return this[temporaryFieldName];
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

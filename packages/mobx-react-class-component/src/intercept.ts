import { computed, intercept as mobxIntercept } from "mobx";
import { evacuate, getDerivedPropertyKey } from "ts-decorator-manipulator";

import { addInitializer, addTerminator } from "./component";

export const intercept = (
  handler: ({ newValue, oldValue }: { newValue?: any; oldValue?: any }) => any,
  closeHandler?: ({ oldValue }: { oldValue: any }) => void
): MethodDecorator => (
  target: object,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor
) => {
  addInitializer(
    target,
    function(this: any) {
      const canceler = mobxIntercept(this, propertyKey, handler.bind(this));
      return () => {
        canceler();
        closeHandler?.({ oldValue: this[propertyKey] });
      };
    },
    propertyKey
  );
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
  const oldValueKey = getDerivedPropertyKey(propertyKey, "oldValue");

  if (closeHandler) {
    addTerminator(target, function(this: any) {
      closeHandler?.({ oldValue: this[oldValueKey] });
    });
  }
  const computedDescriptor = evacuate(computed)(
    target,
    propertyKey,
    descriptor
  );

  return computed({ keepAlive: true })(target, propertyKey, {
    get(this: any) {
      const newValue = descriptor.get?.apply(this);
      const oldValue = this[oldValueKey];
      if (handler.call(this, { newValue, oldValue })) {
        this[oldValueKey] = newValue;
      }
      return this[oldValueKey];
    },
  });
};

// observed.autocloseが、unobservedで呼ばれるのと異なり、
// intercept.computed.autoclose, intercept.autoclose
// は、React.componentが破棄されるタイミングで呼ばれる
// 値の更新ではいずれでも呼ばれる
interceptComputed.autoclose = (handler: (value: any) => void) => {
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
    return true;
  };
  return interceptComputed(wrappedHandler, wrappedHandler);
};

intercept.computed = interceptComputed;

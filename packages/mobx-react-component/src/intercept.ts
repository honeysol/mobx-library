import isEqual from "lodash.isequal";
import { computed, intercept as mobxIntercept } from "mobx";
import { addHandler } from "mobx-initializer";

export const _intercept = (handler: Function): MethodDecorator => (
  target: object,
  fieldName: string | symbol,
  descriptor: PropertyDescriptor
) => {
  const cancelObserveFieldname = Symbol(
    "cancelObserveFieldname: " + fieldName.toString()
  );
  addHandler(target, "stateRegister", function(this: any) {
    this[cancelObserveFieldname] = mobxIntercept(
      this,
      fieldName,
      handler.bind(this)
    );
  });
  addHandler(target, "release", function(this: any) {
    this[cancelObserveFieldname]();
  });
  return descriptor;
};

export const intercept = _intercept as ((
  handler: Function
) => MethodDecorator) & {
  isEqual: MethodDecorator;
  computed: (handler: Function) => MethodDecorator;
};

intercept.computed = (handler: Function): MethodDecorator => (
  target: object,
  fieldName: string | symbol,
  descriptor: PropertyDescriptor
) => {
  const temporaryFieldName = Symbol(
    "temporaryFieldName: " + fieldName.toString()
  );
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

intercept.isEqual = intercept.computed(
  ({ newValue, oldValue }: { newValue: any; oldValue: any }) =>
    !isEqual(newValue, oldValue)
);

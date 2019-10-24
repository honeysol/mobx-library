import { intercept as mobxIntercept, computed } from "mobx";
import { addHandler, parametrizeDecorator } from "../mobx-initializer/util";
import _ from "lodash";

export const _intercept = handler => (target, fieldName, descriptor) => {
  console.log("_intercept", descriptor);
  const cancelObserveFieldname = Symbol("cancelObserveFieldname: " + fieldName);
  addHandler(target, "stateRegister", function(props) {
    this[cancelObserveFieldname] = mobxIntercept(
      this,
      fieldName,
      handler.bind(this)
    );
  });
  addHandler(target, "release", function(props) {
    this[cancelObserveFieldname]();
  });
  return descriptor;
};

export const intercept = parametrizeDecorator(_intercept, () => null);

intercept.computed = handler => (target, fieldName, descriptor) => {
  const temporaryFieldName = Symbol("temporaryFieldName: " + fieldName);
  return computed(target, fieldName, {
    get() {
      const newValue = descriptor.get.apply(this);
      const oldValue = this[temporaryFieldName];
      if (handler.call(this, { newValue, oldValue })) {
        this[temporaryFieldName] = newValue;
      }
      return this[temporaryFieldName];
    },
  });
};

intercept.isEqual = intercept.computed(
  ({ newValue, oldValue }) => !_.isEqual(newValue, oldValue)
);

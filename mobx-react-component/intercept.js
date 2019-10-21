import { intercept as mobxIntercept } from "mobx";
import { addHandler, parametrizeDecorator } from "../mobx-initializer/util";

export const _intercept = interceptFieldName => (
  target,
  fieldName,
  descriptor
) => {
  console.log("_intercept", descriptor);
  if (fieldName) {
    const cancelObserveFieldname = Symbol(
      "cancelObserveFieldname: " + fieldName
    );
    addHandler(target, "stateRegister", function(props) {
      this[cancelObserveFieldname] = mobxIntercept(
        this,
        interceptFieldName,
        descriptor.value.bind(this)
      );
    });
    addHandler(target, "release", function(props) {
      this[cancelObserveFieldname]();
    });
  } else {
    const cancelObserveFieldname = Symbol("cancelObserveFieldname");
    addHandler(target, "stateRegister", function(props) {
      this[cancelObserveFieldname] = mobxIntercept(
        this,
        descriptor.value.bind(this)
      );
    });
    addHandler(target, "release", function(props) {
      this[cancelObserveFieldname]();
    });
  }
};

export const intercept = parametrizeDecorator(_intercept, () => null);

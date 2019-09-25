import { observe, autorun } from "mobx";
import { addHandler, parametrizeDecorator } from "../mobx-initializer/util";

export const _watch = watchFieldName => (target, fieldName, descriptor) => {
  if (fieldName) {
    const cancelObserveFieldname = Symbol(
      "cancelObserveFieldname: " + fieldName
    );
    addHandler(target, "stateRegister", function(props) {
      this[cancelObserveFieldname] = observe(
        this,
        watchFieldName,
        descriptor.value.bind(this)
      );
    });
    addHandler(target, "release", function(props) {
      this[cancelObserveFieldname]();
    });
  } else {
    const cancelObserveFieldname = Symbol("cancelObserveFieldname");
    addHandler(target, "stateRegister", function(props) {
      this[cancelObserveFieldname] = observe(
        watchFieldName,
        descriptor.value.bind(this)
      );
    });
    addHandler(target, "release", function(props) {
      this[cancelObserveFieldname]();
    });
  }
};

export const watch = parametrizeDecorator(_watch, () => null);

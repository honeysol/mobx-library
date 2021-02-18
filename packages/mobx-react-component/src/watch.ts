import { observe } from "mobx";
import { addHandler } from "mobx-initializer";

export const watch = (watchFieldName: string) => (
  target: Function,
  fieldName: string,
  descriptor: PropertyDescriptor
) => {
  if (!descriptor.value) {
    // eslint-disable-next-line no-console
    console.error("decorator error", watchFieldName, fieldName, descriptor);
  }
  if (fieldName) {
    const cancelObserveFieldname = Symbol(
      "cancelObserveFieldname: " + fieldName
    );
    addHandler(target, "stateRegister", function(this: any) {
      this[cancelObserveFieldname] = observe(
        this,
        watchFieldName,
        descriptor.value.bind(this),
        true
      );
    });
    addHandler(target, "release", function(this: any) {
      this[cancelObserveFieldname]();
    });
  } else {
    const cancelObserveFieldname = Symbol("cancelObserveFieldname");
    addHandler(target, "stateRegister", function(this: any) {
      this[cancelObserveFieldname] = observe(
        watchFieldName,
        descriptor.value.bind(this)
      );
    });
    addHandler(target, "release", function(this: any) {
      this[cancelObserveFieldname]();
    });
  }
};

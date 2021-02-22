import { observe } from "mobx";
import { addHandler } from "mobx-initializer";

// Watch field during a component lifecycle

export const watchFor = (watchFieldName: string) => (
  target: object,
  fieldName: string,
  descriptor: PropertyDescriptor
) => {
  const handler = descriptor.value;
  if (typeof handler !== "function") {
    // eslint-disable-next-line no-console
    console.error("decorator error", watchFieldName, fieldName, descriptor);
    return;
  }
  const cancelObserveFieldname = Symbol("cancelObserveFieldname: " + fieldName);
  addHandler(target, "init", function(this: any) {
    this[cancelObserveFieldname] = observe(
      this,
      watchFieldName,
      handler.bind(this),
      true
    );
  });
  addHandler(target, "release", function(this: any) {
    this[cancelObserveFieldname]();
  });
};

export const watch = (handler: Function) => (
  target: object,
  fieldName: string
) => {
  const cancelObserveFieldname = Symbol("cancelObserveFieldname: " + fieldName);
  addHandler(target, "init", function(this: any) {
    this[cancelObserveFieldname] = observe(
      this,
      fieldName,
      handler.bind(this),
      true
    );
  });
  addHandler(target, "release", function(this: any) {
    this[cancelObserveFieldname]();
  });
};

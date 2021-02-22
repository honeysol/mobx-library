import { observe } from "mobx";
import { addHandler } from "mobx-initializer";

import { getDerivedPropertyKey } from "./util";

// Watch field during a component lifecycle

export const watchFor = (watchFieldName: string) => (
  target: object,
  fieldName: string | symbol,
  descriptor: PropertyDescriptor
) => {
  const handler = descriptor.value;
  if (typeof handler !== "function") {
    // eslint-disable-next-line no-console
    console.error("decorator error", watchFieldName, fieldName, descriptor);
    return;
  }
  const cancelObserveFieldName = getDerivedPropertyKey(
    fieldName,
    "cancelObserve"
  );

  addHandler(target, "init", function(this: any) {
    this[cancelObserveFieldName] = observe(
      this,
      watchFieldName,
      handler.bind(this),
      true
    );
  });
  addHandler(target, "release", function(this: any) {
    this[cancelObserveFieldName]();
  });
};

export const watch = (handler: Function) => (
  target: object,
  fieldName: string | symbol
) => {
  const cancelObserveFieldName = getDerivedPropertyKey(
    fieldName,
    "cancelObserve"
  );
  addHandler(target, "init", function(this: any) {
    this[cancelObserveFieldName] = observe(
      this,
      fieldName,
      handler.bind(this),
      true
    );
  });
  addHandler(target, "release", function(this: any) {
    this[cancelObserveFieldName]();
  });
};

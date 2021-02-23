import { observe } from "mobx";
import { getDerivedPropertyKey } from "ts-decorator-manipulator";

import { addHandler } from "./component";

// Watch field during a component lifecycle

export const watchFor = (watchKey: string) => (
  target: object,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor
) => {
  const handler = descriptor.value;
  if (typeof handler !== "function") {
    // eslint-disable-next-line no-console
    console.error("decorator error", watchKey, propertyKey, descriptor);
    return;
  }
  const cancelObserveKey = getDerivedPropertyKey(propertyKey, "cancelObserve");

  addHandler(target, "init", function(this: any) {
    this[cancelObserveKey] = observe(this, watchKey, handler.bind(this), true);
  });
  addHandler(target, "release", function(this: any) {
    this[cancelObserveKey]();
  });
};

export const watch = (handler: Function) => (
  target: object,
  propertyKey: string | symbol
) => {
  const cancelObserveKey = getDerivedPropertyKey(propertyKey, "cancelObserve");
  addHandler(target, "init", function(this: any) {
    this[cancelObserveKey] = observe(
      this,
      propertyKey,
      handler.bind(this),
      true
    );
  });
  addHandler(target, "release", function(this: any) {
    this[cancelObserveKey]();
  });
};

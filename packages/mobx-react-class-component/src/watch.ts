import { observe } from "mobx";

import { addInitializer } from "./component";

// Watch field during a component lifecycle

export const watchFor = (watchKey: string) => (
  target: object,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor
) => {
  const handler = descriptor.value;
  addInitializer(target, function(this: any) {
    return observe(this, watchKey, handler.bind(this), true);
  });
};

export const watch = (handler: Function) => (
  target: object,
  propertyKey: string | symbol
) => {
  addInitializer(target, function(this: any) {
    return observe(this, propertyKey, handler.bind(this), true);
  });
};

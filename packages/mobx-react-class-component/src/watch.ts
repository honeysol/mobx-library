import { reaction } from "mobx";

import { addInitializer } from "./component";

// Watch field during a component lifecycle

export const watchFor = (watchKey: string) => (
  target: object,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor
) => {
  const handler = descriptor.value;
  addInitializer(target, function(this: any) {
    return reaction(
      () => this[watchKey],
      (newValue, oldValue) => {
        handler.call(this, { newValue, oldValue });
      },
      { fireImmediately: true }
    );
  });
};

export const watch = (handler: Function) => (
  target: object,
  propertyKey: string | symbol,
  descriptor?: PropertyDescriptor
) => {
  const getter = descriptor?.get || descriptor?.value;
  addInitializer(target, function(this: any) {
    return reaction(
      () => getter.call(this),
      (newValue: any, oldValue: any) => {
        handler.call(this, { newValue, oldValue });
      },
      { fireImmediately: true }
    );
  });
};

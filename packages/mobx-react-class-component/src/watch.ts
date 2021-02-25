import { reaction } from "mobx";

import { addInitializer } from "./component";

export interface WatchOption {
  fireImmediately?: boolean;
  delay?: number;
  scheduler?: (run: () => void) => void;
}

// Watch field during a component lifecycle

export const watchFor = (watchKey: string, options?: WatchOption) => (
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
      { fireImmediately: true, ...options }
    );
  });
};

export const watch = (handler: Function, options?: WatchOption) => (
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
      { fireImmediately: true, ...options }
    );
  });
};

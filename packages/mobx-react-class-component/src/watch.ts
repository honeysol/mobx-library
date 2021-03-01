import { reaction } from "mobx";

import { addInitializer } from "./component";

export interface WatchOption {
  fireImmediately?: boolean;
  delay?: number;
  scheduler?: (run: () => void) => void;
}

export interface WatchOptionInternal extends WatchOption {
  propertyKey?: string;
  lazy?: boolean; // true: mountedで開始, false(default): constructorで開始
}

// Watch field during a component lifecycle

export const watchFor = (watchKey: string, options?: WatchOption) => (
  target: object,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor
) => {
  const handler = descriptor.value;
  addInitializer(
    target,
    function(this: any) {
      return reaction(
        () => this[watchKey],
        (newValue, oldValue) => {
          try {
            handler.call(this, { newValue, oldValue });
          } catch (e) {
            console.error(e);
          }
        },
        { fireImmediately: true, ...options }
      );
    },
    (options as WatchOptionInternal | undefined)?.propertyKey || propertyKey,
    (options as WatchOptionInternal | undefined)?.lazy ? "mounted" : "init"
  );
};

export const watch = (handler: Function, options?: WatchOption) => (
  target: object,
  propertyKey: string | symbol,
  descriptor?: PropertyDescriptor
) => {
  const getter = descriptor?.get || descriptor?.value;
  addInitializer(
    target,
    function(this: any) {
      return reaction(
        () => getter.call(this),
        (newValue: any, oldValue: any) => {
          handler.call(this, { newValue, oldValue });
        },
        { fireImmediately: true, ...options }
      );
    },
    (options as WatchOptionInternal | undefined)?.propertyKey || propertyKey,
    (options as WatchOptionInternal | undefined)?.lazy ? "mounted" : "init"
  );
};

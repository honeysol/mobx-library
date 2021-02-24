import { computed, observable, observe } from "mobx";
import { getDerivedPropertyKey } from "ts-decorator-manipulator";

import { addInitializer } from "./component";

// resource is deprecated

const defaultHandler = (value: any) => value;

// Example:
// @resource({
// 	on: (resource, handler) => resource.on("update", handler),
// 	off: (resource, handler) => resource.off("update", handler),
// 	handler: value => value, // or event => event.value
// 	resourceKey: "documentResource"
// })
// @observable
// document

export const resource = <Resource>({
  on,
  off,
  handler = defaultHandler,
  resourceKey,
}: {
  on: (resource: Resource, handler: Function) => void;
  off: (resource: Resource, handler: Function) => void;
  handler: Function;
  resourceKey: string;
}) => (
  target: object,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor
) => {
  const wrappedHandlerKey = getDerivedPropertyKey(propertyKey, "wrapped");
  addInitializer(target, function(this: any) {
    this[wrappedHandlerKey] = (...args: any) => {
      this[propertyKey] = handler.apply(this, args);
    };
    const canceler = observe(
      this,
      resourceKey,
      change => {
        const { oldValue, newValue } = change;
        if (oldValue) {
          off(oldValue, this[wrappedHandlerKey]);
        }
        if (newValue) {
          on(newValue, this[wrappedHandlerKey]);
        }
      },
      true
    );
    return () => {
      if (this[resourceKey]) {
        off(this[resourceKey], this[wrappedHandlerKey]);
      }
      canceler();
    };
  });
};

resource.computed = <Resource>({
  on,
  off,
  handler = defaultHandler,
}: {
  on: (resource: Resource, handler: Function) => void;
  off: (resource: Resource, handler: Function) => void;
  handler: Function;
  resourceKey: string;
}) => (target: object, resolvedKey: string, descriptor: PropertyDescriptor) => {
  // resource
  const resourceKey = resolvedKey + "Resource";
  Object.defineProperty(target, resourceKey, descriptor);
  computed(target, resourceKey, descriptor);

  // resolved
  delete (target as any)[resolvedKey];
  return resource({ on, off, handler, resourceKey })(
    target,
    resolvedKey,
    (observable.ref(target, resolvedKey, {
      configurable: true,
      writable: true,
      value: null,
    }) as unknown) as PropertyDescriptor
  );
};
type PromiseCallback<T> = (
  resolve: (value: T) => void,
  reject?: (reason: any) => void
) => void;

export class FastPromise<T> {
  promise: Promise<T>;
  constructor(callback: PromiseCallback<T>) {
    this.promise = new Promise(callback);
  }
  static resolve<T>(value: PromiseLike<T> | any) {
    if (value.then) {
      return new Promise((resolve, rejected) => value.then(resolve, rejected));
    } else {
      return {
        then(handler: PromiseCallback<T>) {
          handler(value);
        },
      };
    }
  }
}

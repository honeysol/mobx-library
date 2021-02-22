import { computed, observable, observe } from "mobx";
import { addHandler } from "mobx-initializer";

// resource is deprecated

const defaultHandler = (value: any) => value;

// Example:
// @resource({
// 	on: (resource, handler) => resource.on("update", handler),
// 	off: (resource, handler) => resource.off("update", handler),
// 	handler: value => value, // or event => event.value
// 	resourceFieldName: "documentResource"
// })
// @observable
// document

export const resource = <Resource>({
  on,
  off,
  handler = defaultHandler,
  resourceFieldName,
}: {
  on: (resource: Resource, handler: Function) => void;
  off: (resource: Resource, handler: Function) => void;
  handler: Function;
  resourceFieldName: string;
}) => (target: object, fieldName: string, descriptor: PropertyDescriptor) => {
  const wrappedHandlerFieldName = Symbol("_" + fieldName + "Handler");
  const cancelObserveFieldname = Symbol("_resource_" + fieldName);

  addHandler(target, "init", function(this: any) {
    this[wrappedHandlerFieldName] = (...args: any) => {
      this[fieldName] = handler.apply(this, args);
    };
    this[cancelObserveFieldname] = observe(
      this,
      resourceFieldName,
      change => {
        const { oldValue, newValue } = change;
        if (oldValue) {
          off(oldValue, this[wrappedHandlerFieldName]);
        }
        if (newValue) {
          on(newValue, this[wrappedHandlerFieldName]);
        }
      },
      true
    );
  });
  addHandler(target, "release", function(this: any) {
    if (this[resourceFieldName]) {
      off(this[resourceFieldName], this[wrappedHandlerFieldName]);
    }
    this[cancelObserveFieldname]();
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
  resourceFieldName: string;
}) => (
  target: object,
  resolvedFieldName: string,
  descriptor: PropertyDescriptor
) => {
  // resource
  const resourceFieldName = resolvedFieldName + "Resource";
  Object.defineProperty(target, resourceFieldName, descriptor);
  computed(target, resourceFieldName, descriptor);

  // resolved
  delete (target as any)[resolvedFieldName];
  return resource({ on, off, handler, resourceFieldName })(
    target,
    resolvedFieldName,
    (observable.ref(target, resolvedFieldName, {
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

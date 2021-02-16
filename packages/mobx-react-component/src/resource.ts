import { observe, computed, observable } from "mobx";
import { addHandler } from "mobx-initializer";

const defaultHandler = value => value;

// Example:
// @resource({
// 	on: (resource, handler) => resource.on("update", handler),
// 	off: (resource, handler) => resource.off("update", handler),
// 	handler: value => value, // or event => event.value
// 	resourceFieldName: "documentResource"
// })
// @observable
// document

export const resource = ({
  on,
  off,
  handler = defaultHandler,
  resourceFieldName,
}) => (target, fieldName, descriptor) => {
  const wrappedHandlerFieldName = Symbol("_" + fieldName + "Handler");
  const cancelObserveFieldname = Symbol("_resource_" + fieldName);

  addHandler(target, "init", function() {
    this[wrappedHandlerFieldName] = (...args) => {
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
  addHandler(target, "release", function() {
    if (this[resourceFieldName]) {
      off(this[resourceFieldName], this[wrappedHandlerFieldName]);
    }
    this[cancelObserveFieldname]();
  });
};

resource.computed = ({ on, off, handler = defaultHandler }) => (
  target,
  resolvedFieldName,
  descriptor
) => {
  // resource
  const resourceFieldName = resolvedFieldName + "Resource";
  Object.defineProperty(target, resourceFieldName, descriptor);
  computed(target, resourceFieldName, descriptor);

  // resolved
  delete target[resolvedFieldName];
  return resource({ on, off, handler, resourceFieldName })(
    target,
    resolvedFieldName,
    observable.ref(target, resolvedFieldName, {
      configurable: true,
      writable: true,
      value: null,
    })
  );
};

import {
  computed,
  onBecomeUnobserved,
  onBecomeObserved,
  observable,
} from "mobx";
import * as crypto from "crypto";

export const becomeObserved = (handler, observingFieldName) => (
  target,
  fieldName,
  descriptor
) => {
  const fieldId = fieldName + crypto.randomBytes(8).toString("hex");
  const isObservingFieldName = fieldId + "IsObserving";
  return computed(target, fieldName, {
    configurable: true,
    get() {
      if (!this[isObservingFieldName]) {
        this[isObservingFieldName] = true;
        const cancelOnBecomeObserved = onBecomeObserved(
          this,
          observingFieldName,
          () => {
            const cancelHandler =
              typeof handler === "function"
                ? handler.apply(this)
                : this[handler]();
            const cancelOnBecomeUnobserved = onBecomeUnobserved(
              this,
              observingFieldName,
              () => {
                cancelOnBecomeUnobserved();
                cancelHandler();
                this[isObservingFieldName] = false;
              }
            );
          }
        );
        const result = this[observingFieldName];
        cancelOnBecomeObserved();
        return result;
      } else {
        return this[observingFieldName];
      }
    },
  });
};

becomeObserved.computed = handler => (target, fieldName, descriptor) => {
  const fieldId = fieldName + crypto.randomBytes(8).toString("hex");
  const temporaryFieldName = fieldId + "Temporary";
  Object.defineProperty(
    target,
    temporaryFieldName,
    computed(target, temporaryFieldName, descriptor)
  );
  return becomeObserved(handler, temporaryFieldName)(target, fieldName);
};

becomeObserved.observable = handler => (target, fieldName, descriptor) => {
  const fieldId = fieldName + crypto.randomBytes(8).toString("hex");
  const temporaryFieldName = fieldId + "Temporary";
  const computedFieldName = fieldId + "Computed";

  Object.defineProperty(
    target,
    temporaryFieldName,
    observable.ref(target, temporaryFieldName, descriptor)
  );
  Object.defineProperty(
    target,
    computedFieldName,
    becomeObserved(handler, temporaryFieldName)(target, computedFieldName)
  );
  return {
    configurable: true,
    get(value) {
      return this[computedFieldName];
    },
    set(value) {
      this[temporaryFieldName] = value;
    },
  };
};

import {
  computed,
  onBecomeUnobserved,
  onBecomeObserved,
  observable,
} from "mobx";
import * as crypto from "crypto";

// import { initializeInstance } from "mobx/utils/decorators";

export const becomeObserved = handler => (target, fieldName, descriptor) => {
  const fieldId = fieldName + crypto.randomBytes(8).toString("hex");
  const temporaryFieldName = fieldId + "Temporary";
  const isObservingFieldName = fieldId + "IsObserving";
  const cancelObservingFieldName = fieldId + "CancelObserving";
  const computedFieldName = fieldId + "Computed";

  //TODO getのときの分岐処理

  const startObserving = function() {
    this[cancelObservingFieldName] = onBecomeObserved(
      this,
      computedFieldName,
      () => {
        const cancelHandler =
          typeof handler === "function" ? handler.apply(this) : this[handler]();
        const cancelOnBecomeUnobserved = onBecomeUnobserved(
          this,
          computedFieldName,
          () => {
            cancelOnBecomeUnobserved();
            cancelHandler();
            this[isObservingFieldName] = false;
          }
        );
      }
    );
  };

  const computedDescriptor = computed(target, computedFieldName, {
    configurable: true,
    get() {
      if (!this[isObservingFieldName]) {
        this[isObservingFieldName] = true;
        startObserving.apply(this);
      }
      const result = this[temporaryFieldName];
      this[cancelObservingFieldName]();
      return result;
    },
  });

  if (descriptor.get && !descriptor.set) {
    Object.defineProperty(
      target,
      temporaryFieldName,
      computed(target, temporaryFieldName, descriptor)
    );
    return computedDescriptor;
  } else {
    Object.defineProperty(
      target,
      temporaryFieldName,
      observable.ref(target, temporaryFieldName, descriptor)
    );
    Object.defineProperty(target, computedFieldName, computedDescriptor);
    return {
      configurable: true,
      get(value) {
        return this[computedFieldName];
      },
      set(value) {
        this[temporaryFieldName] = value;
      },
    };
  }
};

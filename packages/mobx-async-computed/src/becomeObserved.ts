import * as crypto from "crypto";
import {
  computed,
  observable,
  onBecomeObserved,
  onBecomeUnobserved,
} from "mobx";

type handlerType<T> = keyof T | (() => () => void);

export const becomeObserved = <T>(
  handler: handlerType<T>,
  observingFieldName: string
) => (target: T, fieldName: string, descriptor: PropertyDescriptor) => {
  const fieldId = fieldName + crypto.randomBytes(8).toString("hex");
  const isObservingFieldName = fieldId + "IsObserving(becomeObserved)";
  return computed(target, fieldName, {
    configurable: true,
    get(this: any) {
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

becomeObserved.computed = <T>(handler: handlerType<T>) => (
  target: T,
  fieldName: string,
  descriptor: PropertyDescriptor
) => {
  const fieldId = fieldName + crypto.randomBytes(8).toString("hex");
  const temporaryFieldName = fieldId + "Temporary(becomeObserved.computed)";
  Object.defineProperty(
    target,
    temporaryFieldName,
    computed(target, temporaryFieldName, descriptor) as any
  );
  return (becomeObserved(handler, temporaryFieldName) as any)(
    target,
    fieldName
  );
};

becomeObserved.observable = <T>(handler: handlerType<T>) => (
  target: T,
  fieldName: string,
  descriptor: PropertyDescriptor
) => {
  const fieldId = fieldName + crypto.randomBytes(8).toString("hex");
  const temporaryFieldName = fieldId + "Temporary(becomeObserved.observable)";
  const computedFieldName = fieldId + "Computed(becomeObserved.observable)";

  Object.defineProperty(
    target,
    temporaryFieldName,
    (observable.ref(
      target,
      temporaryFieldName,
      descriptor
    ) as unknown) as PropertyDescriptor
  );
  Object.defineProperty(
    target,
    computedFieldName,
    (becomeObserved(handler, temporaryFieldName) as any)(
      target,
      computedFieldName
    )
  );
  return {
    configurable: true,
    get(this: any) {
      return this[computedFieldName];
    },
    set(this: any, value: any) {
      this[temporaryFieldName] = value;
    },
  };
};

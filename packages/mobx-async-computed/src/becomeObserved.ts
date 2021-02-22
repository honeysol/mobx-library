import * as crypto from "crypto";
import {
  computed,
  observable,
  onBecomeObserved,
  onBecomeUnobserved,
} from "mobx";

type handlerType<T> = keyof T | (() => () => void);

const readValueAndCallHandlerIfBecomeObserved = <T>(
  target: T,
  fieldName: keyof T,
  handler: (this: T) => () => void
) => {
  const cancelOnBecomeObserved = onBecomeObserved(target, fieldName, () => {
    const cancelHandler = handler.apply(target);
    const cancelOnBecomeUnobserved = onBecomeUnobserved(
      target,
      fieldName,
      () => {
        cancelOnBecomeUnobserved();
        cancelHandler();
      }
    );
  });
  const result = target[fieldName];
  cancelOnBecomeObserved();
  return result;
};

// observedFieldName のフィールドをproxyして、
// handlerを呼ぶ
const _becomeObservedFor = <T>(
  handler: handlerType<T>,
  observedFieldName: keyof T
) => (target: T, fieldName: string) => {
  const fieldId = fieldName + crypto.randomBytes(8).toString("hex");
  const isObservingFieldName = fieldId + "IsObserving(becomeObserved)";
  return {
    configurable: true,
    get(this: any) {
      if (!this[isObservingFieldName]) {
        this[isObservingFieldName] = true;
        return readValueAndCallHandlerIfBecomeObserved(
          this,
          observedFieldName,
          () => {
            const cancelHandler =
              typeof handler === "function"
                ? handler.apply(this)
                : this[handler]();
            return () => {
              cancelHandler();
              this[isObservingFieldName] = false;
            };
          }
        );
      } else {
        return this[observedFieldName];
      }
    },
    set(this: any, value: any) {
      this[observedFieldName] = value;
    },
  };
};

export const becomeObservedFor = <T>(
  handler: handlerType<T>,
  observedFieldName: keyof T
) => (target: T, fieldName: string) => {
  return computed(
    target,
    fieldName,
    _becomeObservedFor(handler, observedFieldName)(target, fieldName)
  );
};

const noopDecorator = (
  target: object,
  fieldName: string | symbol,
  descriptor: PropertyDescriptor
) => descriptor;

/**
 * @becomeObserved(handler) @computed などと使う
 * ただし、observableのようなPropertyDecoratorとは組み合わせられない
 * （PropertyDecoratorは、decorate呼び出し時点でフィールド名を確定させるため）
 * その場合、
 * @becomObserved(handler, observable)
 * のようにする。
  InternalImplementation{
    [originalFieldName];
    @becomeObservedFor("originalFieldName")
    [fieldName];
  }
 */
export const becomeObserved = <T>(
  handler: handlerType<T>,
  decorator: MethodDecorator = noopDecorator
) => (target: T, fieldName: string, descriptor: PropertyDescriptor) => {
  const fieldId = fieldName + crypto.randomBytes(8).toString("hex");
  const originalFieldName = fieldId + "Original(becomeObserved)";
  Object.defineProperty(
    target,
    originalFieldName,
    (decorator(
      target,
      originalFieldName,
      descriptor
    ) as unknown) as MethodDecorator
  );
  return (becomeObservedFor(handler, originalFieldName as keyof T) as any)(
    target,
    fieldName
  );
};

becomeObserved.observable = <T>(handler: handlerType<T>) => {
  return becomeObserved(handler, observable.ref);
};
becomeObserved.computed = <T>(handler: handlerType<T>) => {
  return becomeObserved(handler, computed);
};

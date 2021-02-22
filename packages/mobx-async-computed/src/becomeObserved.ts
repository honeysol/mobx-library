import {
  computed,
  observable,
  onBecomeObserved,
  onBecomeUnobserved,
} from "mobx";

import { getDerivedPropertyKey, getDerivedPropertyString } from "./util";

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
) => (target: T, fieldName: string | symbol) => {
  const isObservingFieldName = getDerivedPropertyKey(fieldName, "isObserving");
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
) => (target: T, fieldName: string | symbol) => {
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
) => (
  target: T,
  fieldName: string | symbol,
  descriptor: PropertyDescriptor
) => {
  const originalFieldName = getDerivedPropertyString(
    fieldName,
    "original(becomeObserved)"
  );
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

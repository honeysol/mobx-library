import {
  computed,
  observable,
  onBecomeObserved,
  onBecomeUnobserved,
} from "mobx";
import {
  getDerivedPropertyKey,
  getDerivedPropertyString,
} from "ts-decorator-manipulator";

type handlerType = string | (() => () => void);

const readValueAndCallHandlerIfBecomeObserved = (
  target: object,
  propertyKey: string | symbol,
  handler: (this: any) => () => void
) => {
  const cancelOnBecomeObserved = onBecomeObserved(target, propertyKey, () => {
    const cancelHandler = handler.apply(target);
    const cancelOnBecomeUnobserved = onBecomeUnobserved(
      target,
      propertyKey,
      () => {
        cancelOnBecomeUnobserved();
        cancelHandler();
      }
    );
  });
  const result = (target as any)[propertyKey];
  cancelOnBecomeObserved();
  return result;
};

// observedKey のフィールドをproxyして、
// handlerを呼ぶ
const _becomeObservedFor = (
  handler: handlerType,
  observedKey: string | symbol
) => (target: object, propertyKey: string | symbol) => {
  const isObservingKey = getDerivedPropertyKey(propertyKey, "isObserving");
  return {
    configurable: true,
    get(this: any) {
      if (!this[isObservingKey]) {
        this[isObservingKey] = true;
        return readValueAndCallHandlerIfBecomeObserved(
          this,
          observedKey,
          () => {
            // const cancelHandler = this[handler]();
            const cancelHandler =
              typeof handler === "function"
                ? handler.apply(this)
                : this[handler]();
            return () => {
              cancelHandler();
              this[isObservingKey] = false;
            };
          }
        );
      } else {
        return this[observedKey];
      }
    },
    set(this: any, value: any) {
      this[observedKey] = value;
    },
  };
};

export const becomeObservedFor = (
  handler: handlerType,
  observedKey: string | symbol
) => (target: object, propertyKey: string | symbol) => {
  return computed(
    target,
    propertyKey,
    _becomeObservedFor(handler, observedKey)(target, propertyKey)
  );
};

const noopDecorator = (
  target: object,
  propertyKey: string | symbol,
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
    [originalKey];
    @becomeObservedFor("originalKey")
    [propertyKey];
  }
 */
export const becomeObserved = (
  handler: handlerType,
  decorator: MethodDecorator = noopDecorator
) => (
  target: object,
  propertyKey: string | symbol,
  descriptor?: PropertyDescriptor
) => {
  const originalKey = getDerivedPropertyString(
    propertyKey,
    "original(becomeObserved)"
  );
  Object.defineProperty(
    target,
    originalKey,
    (decorator(
      target,
      originalKey,
      descriptor as any
    ) as unknown) as MethodDecorator
  );
  return becomeObservedFor(handler, originalKey)(target, propertyKey) as void;
};

becomeObserved.observable = (handler: handlerType) => {
  return becomeObserved(handler, observable.ref);
};
becomeObserved.computed = (handler: handlerType) => {
  return becomeObserved(handler, computed);
};

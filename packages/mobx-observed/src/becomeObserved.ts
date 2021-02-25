import { computed, createAtom, IAtom, observable } from "mobx";
import {
  getDerivedPropertyKey,
  getDerivedPropertyString,
} from "ts-decorator-manipulator";

type handlerType = string | (() => () => void);

const callHandler = function(
  this: any,
  handler?: handlerType
): (() => void) | null {
  if (typeof handler === "function") return handler.apply(this);
  if (typeof handler === "string") return this[handler]();
  return null;
};

// observedKey のフィールドをproxyして、
// handlerを呼ぶ
export const becomeObservedFor = (
  observedKey: string | symbol,
  handler: handlerType,
  cancelHandler?: handlerType
) => (target: object, propertyKey: string | symbol) => {
  const atomKey = getDerivedPropertyKey(propertyKey, "atom");
  const getAtom = function(this: any) {
    if (!this[atomKey]) {
      this[atomKey] = (() => {
        let canceler: (() => void) | null = null;
        return createAtom(
          atomKey.description || "",
          () => {
            canceler = callHandler.call(this, handler);
          },
          () => {
            canceler?.();
            callHandler.call(this, cancelHandler);
          }
        );
      })();
    }
    return this[atomKey] as IAtom;
  };
  return {
    configurable: true,
    get(this: any) {
      getAtom.call(this).reportObserved();
      return this[observedKey];
    },
    set(this: any, value: any) {
      this[observedKey] = value;
      getAtom.call(this).reportChanged();
    },
  };
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
    @[decorator]
    [originalKey];
    descriptor
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
  return (becomeObservedFor(originalKey, handler)(
    target,
    propertyKey
  ) as unknown) as void;
};

becomeObserved.observable = (handler: handlerType) => {
  return becomeObserved(handler, observable.ref);
};
becomeObserved.computed = (handler: handlerType) => {
  return becomeObserved(handler, computed);
};

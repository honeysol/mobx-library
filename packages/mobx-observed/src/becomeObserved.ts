import { computed, createAtom, IAtom, observable } from "mobx";
import {
  combineMethodDecorator,
  getDerivedPropertyKey,
} from "ts-decorator-manipulator";

import { evacuate } from "./util";

type handlerType = string | (() => () => void);

const callHandler = function(
  this: any,
  handler?: handlerType,
  ...args: []
): (() => void) | null {
  if (typeof handler === "function") return handler.apply(this, args);
  if (typeof handler === "string") return this[handler](...args);
  return null;
};

export const becomeObserved = (
  handler: handlerType,
  cancelHandler?: handlerType
) => (
  target: object,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor
) => {
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
  const getter = descriptor.get || descriptor.value;
  const setter = descriptor.set;
  return {
    configurable: true,
    get(this: any) {
      getAtom.call(this).reportObserved();
      return getter?.call(this);
    },
    set(this: any, value: any) {
      setter?.call(this, value);
    },
  };
};

becomeObserved.observable = (
  handler: handlerType,
  cancelHandler?: handlerType
) => {
  return combineMethodDecorator(
    evacuate(observable.ref),
    becomeObserved(handler, cancelHandler)
  );
};
becomeObserved.computed = (
  handler: handlerType,
  cancelHandler?: handlerType
) => {
  return combineMethodDecorator(
    computed,
    becomeObserved(handler, cancelHandler)
  );
};

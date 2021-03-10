import { logger } from "../logger";

// Mixin two classes in the similar way with class inheritance
// dst: super class, src: sub class
// subclass may have "init" method instead of constructor
// This method is vulable for a change of MobX internal specification
// because it uses descrption field of Symbol("mobx pending decorators")
export const mixinClass = <T, S>(
  dst: new (...args: any[]) => T,
  src: new (...args: any[]) => S
): new (...args: []) => T & S => {
  const constructor = function(this: T & S, ...args: any[]) {
    dst.apply(this, args);
    src.prototype.init?.apply(this, args);
    return this;
  };
  for (const propertyKey of [
    ...Object.getOwnPropertyNames(src.prototype),
    ...Object.getOwnPropertySymbols(src.prototype),
  ]) {
    const descriptor = Object.getOwnPropertyDescriptor(
      src.prototype,
      propertyKey
    );
    const dstDescriptor = Object.getOwnPropertyDescriptor(
      dst.prototype,
      propertyKey
    );
    if (propertyKey === "constructor") {
      continue;
    } else if (descriptor?.value && dstDescriptor?.value) {
      if (typeof dstDescriptor?.value === typeof descriptor?.value) {
        const type = typeof dstDescriptor?.value;
        if (type === "function") {
          logger.log("###function merge", propertyKey);
          dst.prototype[propertyKey] = function(this: any, ...args: any[]) {
            dstDescriptor?.value.call(this, ...args);
            return descriptor?.value.call(this, ...args);
          };
          continue;
        } else if (type === "object") {
          dst.prototype[propertyKey] = {
            ...dstDescriptor?.value,
            ...descriptor?.value,
          };
          logger.log("###object merge", propertyKey);
          continue;
        } else {
          logger.log("cannot merge", propertyKey);
          dst.prototype[propertyKey] = descriptor?.value;
        }
      } else if (descriptor?.value) {
        logger.log("####copy", propertyKey);
        dst.prototype[propertyKey] = descriptor?.value;
      } else {
        logger.log("####ignore", propertyKey);
      }
    } else if (descriptor) {
      Object.defineProperty(dst.prototype, propertyKey, descriptor);
    }
  }
  constructor.prototype = dst.prototype;
  Object.defineProperty(constructor, "name", { value: dst.name });
  return constructor as any;
};

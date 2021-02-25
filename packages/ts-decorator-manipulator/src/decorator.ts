import { getDerivedPropertyKey } from "./util";

export const delegate = (anotherPropertyKey: string | symbol) => (
  target: object
) => {
  return {
    set(this: any, value: any) {
      this[anotherPropertyKey] = value;
    },
    get(this: any) {
      return this[anotherPropertyKey];
    },
  };
};

export const intercept = (
  getHandler?: ({
    newValue,
    oldValue,
  }: {
    newValue: any;
    oldValue: any;
  }) => void,
  setHandler?: ({
    newValue,
    oldValue,
  }: {
    newValue: any;
    oldValue: any;
  }) => void
) => (
  target: object,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor
) => {
  const oldValueKey = getDerivedPropertyKey(propertyKey, "oldValue");
  return {
    set: setHandler
      ? function(this: any, value: any) {
          setHandler({
            newValue: value,
            oldValue: descriptor.get?.call(this),
          });
          descriptor.set?.call(this, value);
        }
      : function(this: any, value: any) {
          descriptor.set?.call(this, value);
        },
    get: getHandler
      ? function(this: any) {
          const value = descriptor.get?.call(this);
          getHandler({ newValue: value, oldValue: this[oldValueKey] });
          this[oldValueKey] = value;
          return value;
        }
      : function(this: any) {
          return this[oldValueKey];
        },
  };
};

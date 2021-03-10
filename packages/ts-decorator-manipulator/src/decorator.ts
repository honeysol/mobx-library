import { getDerivedPropertyString } from "./util";

export const evacuate = (
  decorator: PropertyDecorator | MethodDecorator,
  debugString: string
) => (
  target: object,
  propertyKey: string | symbol,
  descriptor?: PropertyDescriptor
) => {
  const evacuatedKey = getDerivedPropertyString(propertyKey, debugString);
  const newDescriptor = (decorator as any)(
    target,
    evacuatedKey,
    descriptor
  ) as any;
  if (!newDescriptor) {
    // for lazy initializing (including MobX6)
    if (descriptor && !Object.getOwnPropertyDescriptor(target, evacuatedKey)) {
      Object.defineProperty(target, evacuatedKey, descriptor);
    } else {
      Object.defineProperty(target, evacuatedKey, { value: undefined });
    }
    return {
      get(this: any) {
        return this[evacuatedKey];
      },
      set(this: any, value: any) {
        this[evacuatedKey] = value;
      },
      evacuatedKey,
      propertyKey,
    };
  } else {
    Object.defineProperty(target, evacuatedKey, newDescriptor);
    return newDescriptor;
  }
};

export const delegate = (propertyKey: string | symbol) => () => {
  return {
    set(this: any, value: any) {
      this[propertyKey] = value;
    },
    get(this: any) {
      return this[propertyKey];
    },
  };
};

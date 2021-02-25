import { getDerivedPropertyString } from "ts-decorator-manipulator";

export const evacuate = (decorator: PropertyDecorator, debugString: string) => (
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
  Object.defineProperty(target, evacuatedKey, newDescriptor);
  return newDescriptor;
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

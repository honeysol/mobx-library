import { getDerivedPropertyKey } from "ts-decorator-manipulator";

export const evacuate = (decorator: PropertyDecorator, debugString: string) => (
  target: object,
  propertyKey: string | symbol,
  descriptor?: PropertyDescriptor
) => {
  const originalKey = getDerivedPropertyKey(propertyKey, debugString);
  Object.defineProperty(
    target,
    originalKey,
    (decorator as any)(target, originalKey, descriptor) as any
  );
  return delegate(originalKey)();
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

export const combinePropertyDecorator = (
  ...decorators: PropertyDecorator[]
): PropertyDecorator => {
  return (
    _target: object,
    propertyKey: string | symbol,
    _descriptor?: PropertyDescriptor
  ) => {
    const target = _target;
    let descriptor = _descriptor;
    for (const decorator of decorators) {
      descriptor =
        (decorator as any)(target, propertyKey, descriptor) || descriptor;
    }
    return descriptor === _descriptor ? undefined : descriptor;
  };
};

const isClass = (target: any) => {
  return (
    typeof target === "object" &&
    Object.prototype.hasOwnProperty.call(target, "constructor")
  );
};

export type PropertyDecoratorGenerator<A> = (params: A) => PropertyDecorator;
export type PropertyDecoratorOptionalGenerator<
  A
> = PropertyDecoratorGenerator<A> & PropertyDecorator;

export const parametrizePropertyDecorator = <T, S>(
  decoratorGenerator: PropertyDecoratorGenerator<S>,
  defaultValue: (
    target: T,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) => S
): PropertyDecoratorOptionalGenerator<S> => {
  return (((...args: any[]) => {
    if (isClass(args[0])) {
      // without parameter
      const [target, propertyKey, descriptor] = args as [
        T,
        string | symbol,
        PropertyDescriptor
      ];
      return (decoratorGenerator as any)(
        defaultValue(target, propertyKey, descriptor)
      )(target, propertyKey, descriptor);
    } else {
      // with parameter
      const [params] = args as [S];
      return decoratorGenerator(params);
    }
  }) as unknown) as PropertyDecoratorOptionalGenerator<S>;
};

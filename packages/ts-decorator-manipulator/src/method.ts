export const combineMethodDecorator = (
  ...decorators: MethodDecorator[]
): MethodDecorator => {
  return (
    _target: object,
    propertyKey: string | symbol,
    _descriptor: PropertyDescriptor
  ) => {
    const target = _target;
    let descriptor = _descriptor;
    for (const decorator of decorators) {
      descriptor = decorator(target, propertyKey, descriptor) || descriptor;
    }
    return descriptor === _descriptor ? undefined : descriptor;
  };
};

const isClass = (target: unknown) => {
  return (
    typeof target === "object" &&
    Object.prototype.hasOwnProperty.call(target, "constructor")
  );
};
export type MethodDecoratorGenerator<A> = (params: A) => MethodDecorator;
export type MethodDecoratorOptionalGenerator<A> = MethodDecoratorGenerator<A> &
  MethodDecorator;

export const parametrizeMethodDecorator = <T, S>(
  decoratorGenerator: MethodDecoratorGenerator<S>,
  defaultValue: (
    target: T,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) => S
): MethodDecoratorOptionalGenerator<S> => {
  return (((...args: any[]) => {
    if (isClass(args[0])) {
      // without parameter
      const [target, propertyKey, descriptor] = args as [
        T,
        string,
        PropertyDescriptor
      ];
      return decoratorGenerator(defaultValue(target, propertyKey, descriptor))(
        target,
        propertyKey,
        descriptor
      );
    } else {
      // with parameter
      const [params] = args as [S];
      return decoratorGenerator(params);
    }
  }) as unknown) as MethodDecoratorOptionalGenerator<S>;
};

export const combineMethodDecorator = (
  ...decorators: MethodDecorator[]
): MethodDecorator => {
  return (
    _target: object,
    fieldName: string | symbol,
    _descriptor: PropertyDescriptor
  ) => {
    const target = _target;
    let descriptor = _descriptor;
    for (const decorator of decorators) {
      descriptor = decorator(target, fieldName, descriptor) || descriptor;
    }
    //return descriptor === _descriptor ? undefined : descriptor;
  };
};

const isClass = (target: any) => {
  return (
    typeof target === "object" &&
    Object.prototype.hasOwnProperty.call(target, "constructor")
  );
};
export type MethodDecoratorGenerator<A> = (params: A) => MethodDecorator;
export type MethodDecoratorOptionalGenerator<A> = MethodDecoratorGenerator<A> &
  MethodDecorator;

export const parametrizeMethodDecorator = <T, S>(
  decoratorFactory: MethodDecoratorGenerator<S>,
  defaultValue: (
    target: T,
    fieldName: string,
    descriptor: PropertyDescriptor
  ) => S
): MethodDecoratorOptionalGenerator<S> => {
  return (((...args: any[]) => {
    if (isClass(args[0])) {
      // without parameter
      const [target, fieldName, descriptor] = args as [
        T,
        string,
        PropertyDescriptor
      ];
      return decoratorFactory(defaultValue(target, fieldName, descriptor))(
        target,
        fieldName,
        descriptor
      );
    } else {
      // with parameter
      const [params] = args as [S];
      return decoratorFactory(params);
    }
  }) as unknown) as MethodDecoratorOptionalGenerator<S>;
};

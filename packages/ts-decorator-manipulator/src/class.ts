export type ClassDecorator<T extends typeof Object> = (
  target: T
) => T | undefined;

export const combineClassDecorator = <T extends typeof Object>(
  ...decorators: ClassDecorator<T>[]
): ClassDecorator<T> => {
  return ((target: T) => {
    let current = target;
    for (const decorator of decorators) {
      current = decorator(current) || current;
    }
    return current === target ? undefined : current;
  }) as ClassDecorator<T>;
};

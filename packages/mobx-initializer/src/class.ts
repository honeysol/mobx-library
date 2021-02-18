export type ClassType<T> = new (...args: any[]) => T;
export type ClassDecorator<T> = (
  target: ClassType<T>
) => ClassType<T> | undefined;

export const combineClassDecorator = <T>(
  ...decorators: ClassDecorator<T>[]
): ClassDecorator<T> => {
  return ((target: ClassType<T>) => {
    let current = target;
    for (const decorator of decorators) {
      current = decorator(current) || current;
    }
    return current === target ? undefined : current;
  }) as ClassDecorator<T>;
};

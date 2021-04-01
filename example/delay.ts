export const delay = <T>(delay: number, value: T): Promise<T> => {
  return new Promise<T>((resolved) => {
    setTimeout(() => {
      resolved(value);
    }, delay);
  });
};

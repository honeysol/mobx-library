const isPromiseLike = (o: unknown): o is Promise<unknown> => {
  return o ? typeof (o as Promise<unknown>).then === "function" : false;
};

export const nonPromise = <T>(o: Promise<T> | T): T | undefined => {
  return isPromiseLike(o) ? undefined : o;
};

export type Promisable<T> = Promise<T> | T;

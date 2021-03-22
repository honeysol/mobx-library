import type { Annotation } from "mobx/dist/internal.d";

/*  eslint-disable @typescript-eslint/ban-types */
export interface PropertyAccessor<T> {
  get(): T;
  set?(value: T): void;
  debugName?: PropertyKey;
}

export interface ObjectAnnotation<T, R> {
  (accessor?: PropertyAccessor<T>, context?: object): PropertyAccessor<R>;
}

export interface ExtendedAnnotation<T, R> extends Annotation {
  (accessor?: PropertyAccessor<T>, context?: object): PropertyAccessor<R>;
}

export interface AnnotationFunction<T, R> extends Annotation {
  (accessor?: PropertyAccessor<T>, context?: object): PropertyAccessor<R>;
  <T extends object, K>(
    target: T,
    propertyKey: PropertyKey,
    descriptor?: TypedPropertyDescriptor<K>
  ): void | any;
}

export interface AnnotationFunctionPromise extends Annotation {
  <T>(
    accessor?: PropertyAccessor<Promise<T>>,
    context?: object
  ): PropertyAccessor<T>;
  <T extends object, K>(
    target: T,
    propertyKey: PropertyKey,
    descriptor?: TypedPropertyDescriptor<K>
  ): void | any;
}

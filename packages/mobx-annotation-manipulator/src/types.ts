import type { Annotation } from "mobx/dist/internal.d";

export interface PropertyAccessor<T> {
  get(): T;
  set?(value: T): void;
  debugName?: PropertyKey;
}

export interface ObjectAnnotation<T, R> {
  (accessor?: PropertyAccessor<T>, context?: any): PropertyAccessor<R>;
}

export interface ExtendedAnnotation<T, R> extends Annotation {
  (accessor?: PropertyAccessor<T>, context?: any): PropertyAccessor<R>;
}

export interface AnnotationFunction<T, R> extends Annotation {
  (accessor?: PropertyAccessor<T>, context?: any): PropertyAccessor<R>;
  (
    target: any,
    propertyKey: PropertyKey,
    descriptor: PropertyDescriptor
  ): void | PropertyDescriptor;
}

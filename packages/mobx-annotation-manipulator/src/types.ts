import type { Annotation } from "mobx/dist/internal.d";

/*  eslint-disable @typescript-eslint/ban-types */
export interface PropertyAccessor<T> {
  get(): T;
  set?(value: T): void;
  debugName?: PropertyKey;
}

export type BaseAnnotation<P, R> = <PP extends P, RR extends R>(
  params: PP,
  context?: object
) => RR;

export type AsymmetricAnnotation<T, S> = (
  params: PropertyAccessor<T>,
  context?: object
) => PropertyAccessor<S>;

export type SymmetricAnnotation<TT> = <T extends TT>(
  params: PropertyAccessor<T>,
  context?: object
) => PropertyAccessor<T>;

export type PromiseAnnotation<TT> = <T extends TT>(
  params: PropertyAccessor<Promise<T | undefined> | T | undefined>,
  context?: object
) => PropertyAccessor<T | undefined>;

export type ConversionAnnotation<AA extends unknown[], RR> = <
  A extends AA,
  R extends RR
>(
  params: (...args: A) => R,
  context?: object
) => (...args: A) => R;

interface Decorator {
  <T extends object, K>(
    target: T,
    propertyKey: PropertyKey,
    descriptor?: TypedPropertyDescriptor<K>
  ): void | any;
}
export interface ExtendedBaseAnnotation<P, R>
  extends Annotation,
    Decorator,
    BaseAnnotation<P, R> {}

export interface ExtendedSymmetricAnnotation<T>
  extends Annotation,
    Decorator,
    SymmetricAnnotation<T> {}

export interface ExtendedConversionAnnotation<A extends unknown[], R>
  extends Annotation,
    Decorator,
    ConversionAnnotation<A, R> {}

export interface ExtendedPromiseAnnotation<T>
  extends Annotation,
    PromiseAnnotation<T>,
    Decorator {}

export interface ExtendedAsymmetricAnnotation<T, S>
  extends Annotation,
    AsymmetricAnnotation<T, S>,
    Decorator {}

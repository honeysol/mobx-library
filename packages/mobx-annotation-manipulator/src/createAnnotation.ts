import type { ObservableObjectAdministration } from "mobx/dist/internal.d";

import {
  recordAnnotationApplied,
  storeAnnotation,
  storedAnnotationEnabled,
} from "./storedAnnotation";
import {
  AsymmetricAnnotation,
  BaseAnnotation,
  ConversionAnnotation,
  ExtendedAsymmetricAnnotation,
  ExtendedBaseAnnotation,
  ExtendedConversionAnnotation,
  ExtendedPromiseAnnotation,
  ExtendedSymmetricAnnotation,
  PromiseAnnotation,
  PropertyAccessor,
  SymmetricAnnotation,
} from "./types";

const objectAnnotationsKey = Symbol("mobx-object-annotation");

//  eslint-disable-next-line @typescript-eslint/ban-types
type context = object;

export const createBaseAnnotation = <T, R>(
  annotator: (
    annotation: BaseAnnotation<T, R>,
    target: context,
    key: PropertyKey,
    descriptor?: PropertyDescriptor
  ) => PropertyDescriptor,
  asFunction?: boolean
) => (
  annotation: BaseAnnotation<T, R>,
  { annotationType }: { annotationType: string }
): ExtendedBaseAnnotation<T, R> => {
  const annotate = (
    source: context,
    key: PropertyKey,
    descriptor?: PropertyDescriptor
  ) => {
    const _descriptor = annotator(annotation, source, key, descriptor);
    Object.defineProperty(source, key, _descriptor);
    return !!_descriptor;
  };
  const extendedAnnotation = Object.assign(
    ((
      target: context,
      key: string | symbol,
      descriptor: PropertyDescriptor
    ) => {
      if (typeof key !== "string" && typeof key !== "symbol") {
        // delegate original objectAnnotation
        return annotation(target as any, key);
      } else if (storedAnnotationEnabled) {
        // simulate MobX6 decorator (initialized with mobx.makeObservable or mobx.makeAutoObservable)
        storeAnnotation.call(target, key, extendedAnnotation);
      } else {
        // simulate MobX5 decorator (initialized in first access)
        const getObjectAnnotation = function (this: context) {
          const objectAnnotations = getPropertyWithDefault(
            this,
            objectAnnotationsKey,
            () => ({})
          );
          return getPropertyWithDefault(objectAnnotations, key, () =>
            annotator(annotation, this, key, descriptor)
          );
        };
        if (!asFunction) {
          return {
            configurable: true,
            get(this: context): R {
              const objectAnnotation = getObjectAnnotation.call(this);
              return objectAnnotation.get?.();
            },
            set(this: context, value: R) {
              const objectAnnotation = getObjectAnnotation.call(this);
              objectAnnotation.set?.(value);
            },
          };
        } else {
          return {
            configurable: true,
            value(...args: unknown[]): R {
              const objectAnnotation = getObjectAnnotation.call(this);
              return objectAnnotation.value?.(...args);
            },
          };
        }
      }
    }) as ExtendedBaseAnnotation<T, R>,
    {
      // MobX6 new annotation
      annotationType_: annotationType,
      make_(adm: ObservableObjectAdministration, key: PropertyKey): void {
        const source = adm.target_;
        const descriptor = traverseDescriptor(source, key);
        if (annotate(source, key, descriptor)) {
          recordAnnotationApplied(adm, extendedAnnotation, key);
        } else {
          throw Error(
            `Annotation ${annotationType} cannot apply to ${key.toString()}`
          );
        }
      },
      extend_(
        adm: ObservableObjectAdministration,
        key: PropertyKey,
        descriptor: PropertyDescriptor
      ): boolean | null {
        const source = adm.target_;
        return annotate(source, key, descriptor);
      },
    }
  );
  return extendedAnnotation;
};

export const createSymmetricAnnotation = <T>(
  objectAnnotation: SymmetricAnnotation<T>,
  { annotationType }: { annotationType: string }
): ExtendedSymmetricAnnotation<T> => {
  return createBaseAnnotation<PropertyAccessor<T>, PropertyAccessor<T>>(
    (
      annotation: BaseAnnotation<PropertyAccessor<T>, PropertyAccessor<T>>,
      target: context,
      key: PropertyKey,
      descriptor?: PropertyDescriptor
    ) => {
      return annotation(bindAccessor(target, descriptor, key), target);
    }
  )(
    objectAnnotation as BaseAnnotation<
      PropertyAccessor<T>,
      PropertyAccessor<T>
    >,
    { annotationType }
  );
};

export const createPromiseAnnotation = <T>(
  objectAnnotation: PromiseAnnotation<T>,
  { annotationType }: { annotationType: string }
): ExtendedPromiseAnnotation<T> => {
  return createBaseAnnotation<
    PropertyAccessor<Promise<T>>,
    PropertyAccessor<T>
  >(
    (
      annotation: BaseAnnotation<
        PropertyAccessor<Promise<T>>,
        PropertyAccessor<T>
      >,
      target: context,
      key: PropertyKey,
      descriptor?: PropertyDescriptor
    ) => {
      return annotation(bindAccessor(target, descriptor, key), target);
    }
  )(
    objectAnnotation as BaseAnnotation<
      PropertyAccessor<Promise<T>>,
      PropertyAccessor<T>
    >,
    { annotationType }
  );
};

export const createAsymmetricAnnotation = <T, S>(
  objectAnnotation: AsymmetricAnnotation<T, S>,
  { annotationType }: { annotationType: string }
): ExtendedAsymmetricAnnotation<T, S> => {
  return createBaseAnnotation<PropertyAccessor<T>, PropertyAccessor<S>>(
    (
      annotation: BaseAnnotation<PropertyAccessor<T>, PropertyAccessor<S>>,
      target: context,
      key: PropertyKey,
      descriptor?: PropertyDescriptor
    ) => {
      return annotation(bindAccessor(target, descriptor, key), target);
    }
  )(
    objectAnnotation as BaseAnnotation<
      PropertyAccessor<T>,
      PropertyAccessor<S>
    >,
    { annotationType }
  );
};

export const createConversionAnnotation = <A extends unknown[], R>(
  conversionAnnotation: ConversionAnnotation<A, R>,
  { annotationType }: { annotationType: string }
): ExtendedConversionAnnotation<A, R> => {
  return createBaseAnnotation<(...args: A) => R, (...args: A) => R>(
    (
      annotation: BaseAnnotation<(...args: A) => R, (...args: A) => R>,
      target: context,
      key: PropertyKey,
      descriptor?: PropertyDescriptor
    ) => {
      return {
        value: annotation(descriptor?.value?.bind(target), target),
      };
    },
    true
  )(
    conversionAnnotation as BaseAnnotation<
      (...args: A) => R,
      (...args: A) => R
    >,
    { annotationType }
  );
};

const traverseDescriptor = (_source: context, key: PropertyKey) => {
  let source = _source;
  while (source && source !== Object.prototype) {
    const descriptor = Object.getOwnPropertyDescriptor(source, key);
    if (descriptor) {
      return descriptor;
    }
    source = Object.getPrototypeOf(source);
  }
};

const bindAccessor = <T>(
  target: context,
  accessor?: TypedPropertyDescriptor<T>,
  debugName?: PropertyKey
) => {
  return {
    get: ((accessor?.get ||
      (typeof accessor?.value === "function"
        ? accessor?.value
        : null)) as any)?.bind(target),
    set: accessor?.set?.bind(target),
    debugName,
  };
};

const getPropertyWithDefault = <R>(
  target: any,
  key: PropertyKey,
  callback: () => R
): R => {
  if (!target[key]) {
    target[key] = callback();
  }
  return target[key];
};

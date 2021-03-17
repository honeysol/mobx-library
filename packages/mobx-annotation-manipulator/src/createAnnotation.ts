import type { ObservableObjectAdministration } from "mobx/dist/internal.d";

import {
  recordAnnotationApplied,
  storeAnnotation,
  storedAnnotationEnabled,
} from "./storedAnnotation";
import {
  AnnotationFunction,
  ObjectAnnotation,
  PropertyAccessor,
} from "./types";

const objectAnnotationsKey = Symbol("mobx-object-annotation");

export function createAnnotation<T, R>(
  objectAnnotation: ObjectAnnotation<T, R>,
  { annotationType }: { annotationType: string }
): AnnotationFunction<T, R> {
  const annotate = (
    source: any,
    key: PropertyKey,
    descriptor: PropertyAccessor<T>
  ) => {
    const accessor = objectAnnotation(
      bindAccessor(source, descriptor, key),
      source
    );
    Object.defineProperty(source, key, {
      configurable: true,
      get: accessor.get,
      set: accessor.set,
    });
    return !!accessor;
  };
  const annotation = Object.assign(
    ((target: any, key: string | symbol, descriptor: PropertyDescriptor) => {
      if (typeof key !== "string" && typeof key !== "symbol") {
        // delegate original objectAnnotation
        return objectAnnotation(target, key);
      } else if (storedAnnotationEnabled) {
        // simulate MobX6 decorator (initialized with mobx.makeObservable or mobx.makeAutoObservable)
        storeAnnotation.call(target, key, annotation);
      } else {
        // simulate MobX5 decorator (initialized in first access)
        const getObjectAnnotation = function (this: any) {
          const objectAnnotations = getPropertyWithDefault(
            this,
            objectAnnotationsKey,
            () => ({})
          );
          return getPropertyWithDefault(objectAnnotations, key, () =>
            objectAnnotation(
              bindAccessor(this, descriptor as PropertyAccessor<T>, key),
              this
            )
          );
        };
        return {
          configurable: true,
          get(this: any): R {
            const objectAnnotation = getObjectAnnotation.call(this);
            return objectAnnotation.get();
          },
          set(this: any, value: R) {
            const objectAnnotation = getObjectAnnotation.call(this);
            objectAnnotation.set?.(value);
          },
        };
      }
    }) as AnnotationFunction<T, R>,
    {
      // MobX6 new annotation
      annotationType_: annotationType,
      make_(adm: ObservableObjectAdministration, key: PropertyKey): void {
        const source = adm.target_;
        const descriptor = traverseDescriptor(
          source,
          key
        ) as PropertyAccessor<T>;
        if (annotate(source, key, descriptor)) {
          recordAnnotationApplied(adm, annotation, key);
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
        return annotate(source, key, descriptor as PropertyAccessor<T>);
      },
    }
  );
  return annotation;
}

const traverseDescriptor = (_source: any, key: PropertyKey) => {
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
  target: any,
  accessor: TypedPropertyDescriptor<T>,
  debugName: PropertyKey
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

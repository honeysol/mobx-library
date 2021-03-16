import type {
  Annotation,
  ObservableObjectAdministration,
} from "mobx/dist/internal.d";

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

const objectAnnotationsKey = Symbol("mobxObjectAnnotation");
const localStoredAnnotationsKey = Symbol("mobxStoredAnnotation");

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

export const getStoredAnnotation = function (
  this: any
): Record<PropertyKey, Annotation> {
  const storedAnnotationsKey = Object.getOwnPropertySymbols(
    Object.getPrototypeOf(this)
  ).find((key) => key.description === "mobx-stored-annotations") as symbol;
  return this[storedAnnotationsKey];
};
export const makeLocalObservable = (target: any) => {
  const storedAnnotations = localStoredAnnotationsKey;
  for (const [key, annotation] of Object.entries(storedAnnotations)) {
    annotation.make_({ target_: target }, key);
  }
};

export function createAnnotation<T, R>(
  objectAnnotation: ObjectAnnotation<T, R>,
  { annotationType, lazy }: { annotationType: string; lazy?: boolean }
): AnnotationFunction<T, R> {
  const annotate = (
    source: any,
    key: PropertyKey,
    descriptor: PropertyAccessor<T>
  ) => {
    const definePropertyOutcome = objectAnnotation(
      bindAccessor(source, descriptor, key),
      source
    );
    Object.defineProperty(source, key, {
      configurable: true,
      get: definePropertyOutcome.get,
      set: definePropertyOutcome.set,
    });
    return definePropertyOutcome;
  };
  const annotation = Object.assign(
    ((target: any, key: string | symbol, descriptor: PropertyDescriptor) => {
      if (typeof key !== "string" && typeof key !== "symbol") {
        // delegate original objectAnnotation
        return objectAnnotation(target, key);
      } else if (lazy) {
        // simulate MobX6 decorator (initialized with makeLocalObservable)
        const localStoredAnnotations = getPropertyWithDefault(
          target,
          localStoredAnnotationsKey,
          () => ({} as Record<string | symbol, Annotation>)
        );
        localStoredAnnotations[key as string] = annotation;
      } else {
        // simulate MobX5 decorator (initialized in first access)
        const getObjectAnnotation = function (this: any) {
          return getPropertyWithDefault(
            getPropertyWithDefault(
              this,
              objectAnnotationsKey,
              () => ({} as Record<string | symbol, ObjectAnnotation<T, R>>)
            ),
            key,
            () =>
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
      // MobX6 annotation
      annotationType_: annotationType,
      make_(adm: ObservableObjectAdministration, key: PropertyKey): void {
        const source = adm.target_;
        const descriptor = traverseDescriptor(
          source,
          key
        ) as PropertyAccessor<T>;
        const storedAnnotation = getStoredAnnotation.call(adm.target_);
        if (descriptor) {
          if (annotate(source, key, descriptor)) {
            delete storedAnnotation?.[key as any];
          }
        }
        if (!storedAnnotation?.[key as any]) {
          throw Error(
            `Annotation ${
              annotation.annotationType_
            } cannot apply to ${key.toString()}.${key.toString()}`
          );
        }
      },
      extend_(
        adm: ObservableObjectAdministration,
        key: PropertyKey,
        descriptor: PropertyDescriptor
      ): boolean | null {
        const source = adm.target_;
        return !!annotate(source, key, descriptor as PropertyAccessor<T>);
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

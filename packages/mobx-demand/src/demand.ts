import { createAtom, IAtom } from "mobx";
import {
  assert,
  createAnnotation,
  ExtendedObjectAnnotation,
  PropertyAccessor,
} from "mobx-annotation-manipulator";

const none = Symbol("none");
const isNotEmpty = <T>(value: T | typeof none): value is T => {
  return value !== none;
};

export interface IDemand<T> {
  get: () => T;
}

class Demand<T> {
  private readonly generatorFn: () => T;
  private readonly delay?: number;
  private readonly atom: IAtom;
  private readonly cleanUpFn?: (value: T) => void;
  private value: T | typeof none = none;
  private cancelTimer?: NodeJS.Timeout;
  private observed = false;
  constructor({
    generatorFn,
    cleanUpFn,
    delay,
    name,
  }: {
    generatorFn: () => T;
    cleanUpFn?: (value: T) => void;
    delay?: number;
    name?: string;
  }) {
    this.cleanUpFn = cleanUpFn;
    this.generatorFn = generatorFn;
    this.delay = delay;
    this.atom = createAtom(
      name || "demand",
      () => {
        this.observed = true;
        this.stopCleanUpTimer();
      },
      () => {
        this.observed = false;
        this.startCleanUpTimer();
      }
    );
  }
  private cleanUp() {
    isNotEmpty(this.value) && this.value && this.cleanUpFn?.(this.value);
    this.value = none;
  }
  private startCleanUpTimer() {
    if (typeof this.delay === "number") {
      this.stopCleanUpTimer();
      this.cancelTimer = setTimeout(() => {
        this.cancelTimer = undefined;
        this.cleanUp();
      }, this.delay);
    } else {
      this.cleanUp();
    }
  }
  private stopCleanUpTimer() {
    if (this.cancelTimer) {
      clearTimeout(this.cancelTimer);
      this.cancelTimer = undefined;
    }
  }
  get() {
    this.atom.reportObserved();
    if (!isNotEmpty(this.value)) {
      this.value = this.generatorFn();
    }
    const value = this.value;
    if (!this.observed) {
      // hook for untracked access
      this.startCleanUpTimer();
    }
    return value;
  }
}

export const demand = <TT>({
  cleanUpFn,
  delay,
  name,
}: {
  cleanUpFn?: (value: TT) => void;
  delay?: number;
  name?: string;
}): ExtendedObjectAnnotation<TT> => {
  return createAnnotation<TT>(
    <T extends TT>(accessor?: PropertyAccessor<T>) => {
      assert(accessor?.get, "accessor doesn't have get property", accessor);
      return new Demand<T>({
        cleanUpFn,
        delay,
        name,
        generatorFn: accessor.get,
      });
    },
    {
      annotationType: "demand",
    }
  );
};

import { createAtom, IAtom } from "mobx";

class ResourceItem<T> {
  value: T;
  cleanUpFn: (value: T) => void;
  cancelTimer?: NodeJS.Timeout;
  delay?: number;
  atom: IAtom;
  observed = false;
  startTimer() {
    if (typeof this.delay === "number") {
      this.stopTimer();
      this.cancelTimer = setTimeout(() => {
        this.cancelTimer = undefined;
        this.cleanUpFn?.(this.value);
      }, this.delay);
    } else {
      this.cleanUpFn?.(this.value);
    }
  }
  stopTimer() {
    if (this.cancelTimer) {
      clearTimeout(this.cancelTimer);
      this.cancelTimer = undefined;
    }
  }
  constructor({
    value,
    cleanUpFn,
    delay,
    name,
  }: {
    value: T;
    cleanUpFn: (value: T) => void;
    delay?: number;
    name: string;
  }) {
    this.value = value;
    this.cleanUpFn = cleanUpFn;
    this.delay = delay;
    this.atom = createAtom(
      name,
      () => {
        this.observed = true;
        this.stopTimer();
      },
      () => {
        this.observed = false;
        this.startTimer();
      }
    );
  }
  get() {
    this.atom.reportObserved();
    if (!this.observed) {
      // hook for untracked access
      this.startTimer();
    }
    return this.value;
  }
}

export class ResourceCache<T> {
  generatorFn: (key: string) => T;
  cleanUpFn?: (value: T) => void;
  delay;
  cache = new Map<string, ResourceItem<T>>();
  constructor({
    generatorFn,
    cleanUpFn,
    delay,
  }: {
    generatorFn: (key: string) => T;
    cleanUpFn?: (value: T) => void;
    delay?: number;
  }) {
    this.generatorFn = generatorFn;
    this.cleanUpFn = cleanUpFn;
    this.delay = delay;
  }

  get(key: string): T {
    const item =
      this.cache.get(key) ||
      (() => {
        const item = new ResourceItem<T>({
          value: this.generatorFn(key),
          cleanUpFn: (value: T) => {
            this.cache.delete(key);
            this.cleanUpFn?.(value);
          },
          delay: this.delay,
          name: key,
        });
        this.cache.set(key, item);
        return item;
      })();
    return item.get();
  }
  has(key: string): boolean {
    return this.cache.has(key);
  }
}

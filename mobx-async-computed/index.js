import {
  observe,
  computed,
  runInAction,
  observable,
  onBecomeObserved,
  onBecomeUnobserved,
} from "mobx";
import { AsyncCommitter } from "./asyncCommitter";
import * as crypto from "crypto";

const createAsyncComputed = observableFunc => (
  target,
  fieldName,
  descriptor
) => {
  const fieldId = fieldName + crypto.randomBytes(8).toString("hex");
  const getterFieldName = fieldName;
  const resolvedFieldName = fieldId + "Result";
  const promiseFieldName = fieldId + "Promise";
  const isObservingFieldName = fieldId + "IsObserving";
  const asyncCommitterFieldName = fieldId + "AsyncCommitter";
  const cancelObservingFieldName = fieldId + "CancelObserving";
  // Object.defineProperty(target, promiseFieldName, descriptor);
  // delete target[resolvedFieldName];
  computed(target, promiseFieldName, descriptor);

  observableFunc(target, resolvedFieldName, {
    configurable: true,
    writable: true,
    value: null,
  });

  const startObserving = function() {
    const asyncCommiter = (this[asyncCommitterFieldName] =
      this[asyncCommitterFieldName] || new AsyncCommitter());
    this[cancelObservingFieldName] = onBecomeObserved(
      this,
      resolvedFieldName,
      () => {
        const cancelObserve = observe(
          this,
          promiseFieldName,
          async ({ newValue }) => {
            const { successed, value } = await asyncCommiter.resolve(newValue);
            if (successed) {
              runInAction(() => {
                this[resolvedFieldName] = value;
              });
            }
          },
          true
        );
        const cancelOnBecomeUnobserved = onBecomeUnobserved(
          this,
          resolvedFieldName,
          () => {
            cancelOnBecomeUnobserved();
            cancelObserve();
            this[isObservingFieldName] = false;
          }
        );
      }
    );
  };
  return computed(target, getterFieldName, {
    configurable: true,
    writable: true,
    get() {
      if (!this[isObservingFieldName]) {
        this[isObservingFieldName] = true;
        startObserving.apply(this);
      }
      const result = this[resolvedFieldName];
      this[cancelObservingFieldName]();
      return result;
    },
  });
};

export const asyncComputed = createAsyncComputed(observable.ref);
asyncComputed.deep = createAsyncComputed(observable.deep);
asyncComputed.shallow = createAsyncComputed(observable.shallow);
asyncComputed.ref = createAsyncComputed(observable.ref);
asyncComputed.struct = createAsyncComputed(observable.struct);

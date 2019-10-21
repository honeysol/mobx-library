import { observe, computed, runInAction, observable } from "mobx";
import { AsyncCommitter } from "./asyncCommitter";
import * as crypto from "crypto";
import { becomeObserved } from "./becomeObserved";

export const asyncComputed = (target, fieldName, descriptor) => {
  const fieldId = fieldName + crypto.randomBytes(8).toString("hex");
  const resultFieldName = fieldId + "Result";
  const promiseFieldName = fieldId + "Promise";
  const asyncCommitterFieldName = fieldId + "AsyncCommitter";
  Object.defineProperty(
    target,
    promiseFieldName,
    computed(target, promiseFieldName, descriptor)
  );

  Object.defineProperty(
    target,
    resultFieldName,
    observable.ref(target, resultFieldName, {
      configurable: true,
      writable: true,
      value: null,
    })
  );

  return becomeObserved(function() {
    const asyncCommiter = (this[asyncCommitterFieldName] =
      this[asyncCommitterFieldName] || new AsyncCommitter());
    return observe(
      this,
      promiseFieldName,
      async ({ newValue }) => {
        const { successed, value } = await asyncCommiter.resolve(newValue);
        if (successed) {
          runInAction(() => {
            this[resultFieldName] = value;
          });
        }
      },
      true
    );
  })(target, fieldName, {
    get() {
      return this[resultFieldName];
    },
  });
};

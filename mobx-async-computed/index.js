import { observe, computed, runInAction, observable } from "mobx";
import { AsyncCommitter } from "./asyncCommitter";
import * as crypto from "crypto";
import { becomeObserved } from "./becomeObserved";

export const asyncComputed = (target, fieldName, descriptor) => {
  const fieldId = fieldName + crypto.randomBytes(8).toString("hex");
  const resultFieldName = fieldId + "Result(asyncComputed)";
  const promiseFieldName = fieldId + "Promise(asyncComputed)";
  const asyncCommitterFieldName = fieldId + "AsyncCommitter(asyncComputed)";
  Object.defineProperty(
    target,
    promiseFieldName,
    computed(target, promiseFieldName, {
      get: descriptor.get || descriptor.value,
    })
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
  }, resultFieldName)(target, fieldName);
};

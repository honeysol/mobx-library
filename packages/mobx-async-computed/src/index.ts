import * as crypto from "crypto";
import { computed, observable, observe, runInAction } from "mobx";

import { AsyncCommitter } from "./asyncCommitter";
import { becomeObserved } from "./becomeObserved";

export const asyncComputed = <T>(
  target: T,
  fieldName: keyof T,
  descriptor: PropertyDescriptor
) => {
  const fieldId = fieldName + crypto.randomBytes(8).toString("hex");
  const resultFieldName = fieldId + "Result(asyncComputed)";
  const promiseFieldName = fieldId + "Promise(asyncComputed)";
  const asyncCommitterFieldName = fieldId + "AsyncCommitter(asyncComputed)";
  Object.defineProperty(
    target,
    promiseFieldName,
    computed(target, promiseFieldName, {
      get: descriptor.get || descriptor.value,
    }) as any
  );

  Object.defineProperty(
    target,
    resultFieldName,
    observable.ref(target, resultFieldName, {
      configurable: true,
      writable: true,
      value: null,
    }) as any
  );

  return (becomeObserved(function(this: any) {
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
  }, resultFieldName) as any)(target, fieldName);
};

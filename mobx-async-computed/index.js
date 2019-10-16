import { observe, computed, runInAction, observable } from "mobx";
import { AsyncCommitter } from "./asyncCommitter";
import { addHandler } from "../mobx-initializer/util";

const createAsyncComputed = observableFunc => (
  target,
  resolvedFieldName,
  descriptor
) => {
  const promiseFieldName = resolvedFieldName + "Promise";
  const cancelObserveFieldname = Symbol("_observe_" + promiseFieldName);

  addHandler(target, "init", function() {
    const asyncCommiter = new AsyncCommitter();
    this[cancelObserveFieldname] = observe(
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
  });
  Object.defineProperty(target, promiseFieldName, descriptor);
  delete target[resolvedFieldName];
  computed(target, promiseFieldName, descriptor);
  observableFunc(target, resolvedFieldName, {
    configurable: true,
    writable: true,
    value: null,
  });

  addHandler(target, "release", function(props) {
    this[cancelObserveFieldname]();
  });
};

export const asyncComputed = createAsyncComputed(observable);
asyncComputed.deep = createAsyncComputed(observable.deep);
asyncComputed.shallow = createAsyncComputed(observable.shallow);
asyncComputed.ref = createAsyncComputed(observable.ref);
asyncComputed.struct = createAsyncComputed(observable.struct);
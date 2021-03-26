import { autorun, makeObservable, observable, runInAction } from "mobx";
import { memoize } from "mobx-memo";

import { delay } from "./delay";
// prerequisite
class MobXCalc {
  @observable promise: Promise<Float64Array> | Float64Array;
  constructor(a: number, b: number) {
    this.promise = (async () => {
      const value = await delay(
        1000,
        new Float64Array(1024 * 1024).fill(a + b)
      );
      runInAction(() => {
        this.promise = value;
      });
      return value;
    })();
    makeObservable(this);
  }
  close() {
    console.log("###MobXCalc closed");
  }
}
const mobxCalc = (a: number, b: number) => new MobXCalc(a, b);
// As function
const memoizedFetch = memoize({
  delay: 3000,
  cleanUpFn: (item: MobXCalc) => {
    item.close();
  },
})(mobxCalc);

(async () => {
  const c = memoizedFetch(1, 2);
  const canceler = autorun(() => {
    console.log("c = ", memoizedFetch(1, 2).promise);
    console.log("c = ", memoizedFetch(1, 2).promise);
    console.log("c = ", memoizedFetch(1, 2).promise);
    console.log("c = ", memoizedFetch(1, 2).promise);
    console.log("c = ", memoizedFetch(1, 2).promise);
    console.log("c = ", memoizedFetch(1, 2).promise);
    console.log("c = ", memoizedFetch(10, 20).promise);
  });
  await delay(3000, null);
  canceler();
})();

declare let window: any;

// // As decorator
// class Foo {
//   @memoize({
//     delay: 60000,
//     cleanUpFn: (item: MobXCalc) => {
//       item.close();
//     },
//   })
//   mobxCalc(a: number, b: number) {
//     return mobxCalc(a, b);
//   }
// }

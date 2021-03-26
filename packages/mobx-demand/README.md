## Overview

Resource controller based on MobX, with automatically resource generation and release.

If `delay` field is specified, the cache is retained until `delay` millisecond after `object.get(key)` is unobserved or untracked access is performed.

If `delay` field is not specified, the cache is retained while `object.get(key)` is observed, and untracked access is not cached.

## Comparison with similar libary

mobx-demand is similar to `fromResource` of mobx-utils. But the points below are different.

- mobx-demand supports lazy release with `delay` propoerty.
- mobx-demand generates a new object when it becomes observed and release it when it becomes unobserved, while `fromResource` only calls the event and provides an accessor. This can reduce memory usage when the object is not observed and makes it easy to develop the caching and memoization implementation like [mobx-resource-cache](https://github.com/honeysol/mobx-library/tree/develop/packages/mobx-resource-cache) and [mobx-memo](https://github.com/honeysol/mobx-library/tree/develop/packages/mobx-memo).

## compatibility

Supports MobX5, MobX6.

## Example

```js
import { demand } from "mobx-demand";
import { observable, makeObservable } from "mobx";
import { profile } from "./authentication";
import { firestore } from "./firebaseProject";

// Prerequisite
class MyProfile {
  canceler;
  @observable snapshot = null;
  constructor() {
    this.canceler = firestore.doc("/users/${profile.userId}").onSnapshot(snapshot => {
      this.snapshot = snapshot;
    })
    makeObservable(this);
  }
  close() {
    this.canceler();
  }
}
// Main
const profile = demand({
  cleanUpFn: (item) => item.close(),
  delay: 1000
})(() => new MyProfile())
```

## Related library

mobx-demand is designed as a module for [mobx-resource-cache](https://github.com/honeysol/mobx-library/tree/develop/packages/mobx-resource-cache) and [mobx-memo](https://github.com/honeysol/mobx-library/tree/develop/packages/mobx-memo). In many cases, it might be appropriate to use these libraries.
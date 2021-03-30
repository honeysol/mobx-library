## Overview

Generate value on demand, cleanup when it will become unused, with non-MobX generator

If `delay` field is specified, the cache is retained until `delay` millisecond after `object.get()` is unobserved or untracked access is performed.

If `delay` field is not specified, the cache is retained while `object.get()` is observed, and untracked access is not cached.

## compatibility

Supports MobX5, MobX6 including Annotation/Decorator.

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
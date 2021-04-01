## Overview

Autoclose handler based on MobX, with automatic resource generation and release.

If `delay` field is specified, the cache is retained until `delay` millisecond after `object.get(key)` is unobserved or untracked access is performed.

If `delay` field is not specified, the cache is retained while `object.get(key)` is observed, and untracked access is not cached.

## Comparison with similar libary

`autoclose` is similar to `demand` of mobx-demand. But the generator function (get) of demand is not reactive, in other words, the generator function is called always *once* before it is unobserved. On the other hand, the generator function of autoclose is reactive, may be called many times, and cleanup function is called at the change of the value as well as at the time it is unobserved.

## compatibility

Supports MobX5, MobX6.

## Example

```js
import { demand } from "mobx-demand";
import { observable, makeObservable } from "mobx";
import { firestore } from "./firebaseProject";

class DocumentSession {
  canceler;
  @observable.ref snapshot = null;
  constructor(path: string) {
    this.canceler = firestore.doc(path).onSnapshot(snapshot => {
      this.snapshot = snapshot;
    })
    makeObservable(this);
  }
  close() {
    this.canceler();
  }
}
class Document<R> {
  // getter of autoclose can be reactive.
  @observable.ref
  path;

  @autoclose({ cleanup: (session: DocumentSession<R>) => session.close() })
  get session(): DocumentSession<R> {
    return new DocumentSession(this.path);
  }
  get snapshot(): DocumentSnapshot {
    return this.session.snapshot;
  }
}
```

## Related library

mobx-demand is designed as a module for [mobx-resource-cache](https://github.com/honeysol/mobx-library/tree/develop/packages/mobx-resource-cache) and [mobx-memo](https://github.com/honeysol/mobx-library/tree/develop/packages/mobx-memo). In many cases, it might be appropriate to use these libraries.
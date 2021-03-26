## Overview

Implementation of resource cache based on MobX, which supports automatically generation and release to avoid memory leak.

If `delay` field is specified (including zero), the cache is retained until `delay` millisecond after `func(...args)` is unobserved or untracked access is performed.

If `delay` field is not specified, the cache is retained while `func(...args)` is observed, and untracked access is not cached.

## compatibility

Supports MobX5, MobX6. This library uses only mobx.createAtom of MobX and is independent of annotation/decorator implementation.

## Example
```js
import { resourceCache } from "mobx-resource-cache";

// prerequisite
class MobXFetch<T> {
  @observable promise: Promise<T> | T;
  constructor(url: string) {
    this.promise = (async () => {
      const response = await fetch(url);
      const value = await response.json();
      this.promise = value;
      return value;
    })();
  }
  close() {}
}
const mobxFetch = (url: string) => new MobXFetch(url);

// main
const cache = resourceCache({
  delay: 60000,
  generatorFn: (url: string) => mobxFetch,
  cleanUpFn: (item: MobXFetch<unknown>) => {
    item.close();
  },
});
```

# Related libarary

If you are looking for memoization of function, consider [mobx-memo](https://github.com/honeysol/mobx-library/tree/develop/packages/mobx-memo)
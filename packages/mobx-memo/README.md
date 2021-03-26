## Overview

Implementation of memoizer based on MobX, which supports an automatic generation and clean-up of resource.

If `delay` field is specified (including zero), the cache is retained until `delay` millisecond after `cache.get(key)` is unobserved or untracked access is performed.

If `delay` field is not specified, the cache is retained while `cache.get(key)` is observed, and untracked access is not cached.

## compatibility

Supports MobX5, MobX6.

## Example
```js
import { memoize } from "mobx-memo";
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
// As function
const memoizedFetch = memoize({
  delay: 60000,
  cleanUpFn: (item: MobXFetch<unknown>) => {
    item.close();
  },
})(mobxFetch);

// As decorator
class Foo {
  @memoize({
    delay: 60000,
    cleanUpFn: (item: MobXFetch<unknown>) => {
      item.close();
    },
  })
  mobxFetch(url: string) {
    return new MobXFetch(url);
  }
}
```

# Related libarary

If you prefer to more simple API, consider [mobx-resource-cache](https://github.com/honeysol/mobx-library/tree/develop/packages/mobx-resource-cache/)
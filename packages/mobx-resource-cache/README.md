## Overview

MobX Cache with automatically generation and release to avoid memory leak.

If `delay` field is specified, the cache is retained until `delay` millisecond after `cache.get(key)` is unobserved or untracked access is performed.

If `delay` field is not specified, the cache is retained while `cache.get(key)` is observed, and untracked access is not cached.

## compatibility

Supports MobX5, MobX6. This library use `mobx.createAtom()` only.

## Example

```js
const cache = new ResourceCache<Speeker>({
  generatorFn(key) {
    return new Speeker(key);
  },
  // This is optional. It is recommended to use an independent mechanism to clean up a resource, for consistency of clean up.
  cleanUpFn(value) {
    value.close();
  },
  delay: 2000,
});

(async () => {
  autorun(() => {
    cache.get("100");
  });
})();
```
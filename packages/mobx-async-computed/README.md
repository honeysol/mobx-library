## Overview

Resolve MobX5/MobX6 fields asynchronously. Resolves asynchronous ordering disruptions and returns only the results corresponding to the latest promise.

This library does not require a special caller for initialization and termination. Asynchronous resolution starts when it is first referenced and ends when it is no longer referenced. Instead, it won't work without some observing source (observe, autorun, watch, etc.).

### Comparison with similar libraries

[computed-async-mobx](https://www.npmjs.com/package/computed-async-mobx) is the popular asyncComputed library for MobX. But they are different in the strategy to resolve the promise. If a new promise is produced before the former promise is resolved in "computed-async-mobx", the update looks to be stopped. This library aims to resolve this problem.

See [./src/asyncCommitter.ts](./src/asyncCommitter.ts) to investigate the internal algorithm.

## Compatibility

Supports MobX5 / MobX6 including decorator and MobX6 new annotation. 

MobX6 decorator/annotation requires initialization with makeObservable / makeAutoObservable. This feature is experimental and vulnerable for MobX6 internal update in future.

## Example

```js
class Sample{
  // Usage1: Without annotation/decorator
  computed = asyncComputed(() => delay(100, 10));
  get resolve3 (): number {
    return computed.get();
  }

  // Usage2: Use the both of resolved value and unresolved promise.
  @computed
  get promise1 (): Promise<number> {
    return delay(100, 10);
  }
  @asyncComputedFrom ("promise1")
  resolved1: number;

  // Usage3: Simple annotation (not recommended in TypeScript)
  @asyncComputed
  get resolved2 (): number {
    return delay(100, 10) as any;
  }
}
```

## APIs

### @asyncComputedFrom(propertyName: string)
Assign the resolved value of Promise in specified field to this field. The external property(this[propertyName]) is usually @computed.

### @asyncComputed
_Deprecated for Typescript_

Gets the value that resolved the promise. However, Typescript doesn't support changing types with decorators. It is not recommended in Typescript as the actual type and the expression type will not match.

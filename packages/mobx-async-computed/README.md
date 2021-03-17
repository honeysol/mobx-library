## Overview

Resolve MobX5/MobX6 fields asynchronously. Resolves asynchronous ordering disruptions and returns only the results corresponding to the latest promises.

This library does not require a special caller for initialization and termination. Asynchronous resolution starts when it is first referenced and ends when it is no longer referenced. Instead, it won't work without some observing source (observe, autorun, watch, etc.).

## compatibility

Supports MobX5 decorator, MobX6 decorator, and MobX6 annotation. MobX6 decorator requires initialization with makeObservable / makeAutoObservable.

```js
class Sample{
  // Usage1: Use the both of resolved value and unresolved promise.(Recommended)
  @computed
  get promise1 (): Promise<number> {
    return delay(100, 10);
  }
  @asyncComputedFrom ("promise1")
  resolved1: number;
  // Usage2: Simple case
  @asyncComputed
  get resolved2 (): number {
    return delay(100, 10) as any;
  }
  // Usage3: Resolve type mismatch
  @asyncComputed
  get resolved3 (): number {
    return resolveType(delay(100, 10));
  }
}
```

## APIs

### @asyncComputedFrom(propertyName: string)
Assign the resolved value of Promise in specified field to this field. The external property(this[propertyName]) is usually @computed.

### @asyncComputed
_Deprecated for Typescript_

Gets the value that resolved the promise. However, Typescript doesn't support changing types with decorators, so you'll need to use resolveType or another conversion to adjust the type. It is not recommended in Typescript as the actual type and the expression type will not match.

### resolveType (value: T): ResolvedType <T>
_Deprecated for Typescript_

Returns the given Promise as it is. However, only the type is disguised as a resolved type. This is designed to be used with asyncComputed.
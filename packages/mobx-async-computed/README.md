## Overview

Resolve MobX fields asynchronously. Resolves asynchronous ordering disruptions and returns only the results corresponding to the latest promises.

This library does not require a special caller for initialization and termination. Asynchronous resolution starts when it is first referenced and ends when it is no longer referenced. Instead, it won't work without some observing source (observe, autorun, watch, etc.).

```js
class Sample{
  // Usage1: Use the both of resolved value and unresolved promise.
  @asyncComputeTo ("resolved1")
  get promise1 (): Promise<number> {
    return delay(100, 10);
  }
  @observable.ref
  resolved1: number;
  // Usage2: Use the both of resolved value and unresolved promise.
  @computed
  get promise2 (): Promise<number> {
    return delay(100, 10);
  }
  @asyncComputedFrom ("promise2")
  resolved2: number;
  // Usage3: Simple case
  @asyncComputed
  get resolved3 (): number {
    return delay(100, 10) as any;
  }
  // Usage4: Resolve type mismatch
  @asyncComputed
  get resolved4 (): number {
    return resolveType(delay(100, 10));
  }
}
```

## APIs

### @asyncComputeTo (propertyName: string)
Assigns the resolved value of the Promise to the specified property. Property is usually @observable.ref.

### @asyncComputed
_Deprecated for Typescript_

Gets the value that resolved the promise. However, Typescript doesn't support changing types with decorators, so you'll need to use resolveType or another conversion to adjust the type. It is not recommended in Typescript as the actual type and the expression type will not match.

### resolveType (value: T): ResolvedType <T>
_Deprecated for Typescript_

Returns the given Promise as it is. However, only the type is disguised as a resolved type. It is not recommended in Typescript as the actual type and the expression type will not match.
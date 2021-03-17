## Overview

This library provides a decorator version of MobX onBecomeObserved and a decorator to make it more convenient.

## compatibility

Supports MobX5 decorator, MobX6 decorator, and MobX6 annotation. MobX6 decorator requires initialization with makeObservable / makeAutoObservable.

## APIs

### onBecomeObserved

```js
@onBecomeObserved(function(this:any){
  // // onBecomeObserved
  return () => {
    // onBecomeUnobserved
  };
}, function(this:any){
  // onBecomeUnobserved
})
```

### observed

```js
@observed(
  changed: ({newValue, oldValue}) => {})
  enter: ({oldValue}) => {})
  leave: ({oldValue}) => {})
)
```

### observed.async

```js
@observed.async(
  changed: ({newValue, oldValue}, setter) => {})
  enter: ({oldValue}, setter) => {})
  leave: ({oldValue}, setter) => {})
)
```
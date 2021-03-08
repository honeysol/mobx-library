## Overview

This library provides a decorator version of MobX onBecomeObserved and a decorator to make it more convenient.

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
@observed(
  changed: ({newValue, oldValue}, setter) => {})
  enter: ({oldValue}, setter) => {})
  leave: ({oldValue}, setter) => {})
)
```
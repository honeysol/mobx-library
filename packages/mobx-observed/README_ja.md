## 概要

MobXの onBecomeObserved のデコレータバージョンおよび、それをより便利に使うためのdecoratorを提供します。

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
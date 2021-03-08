## Overview

MobX binding to React.Component.

It provides improved performance and simplicity compared to similar libraries and hook APIs.

### Comparison with similar libraries

This library is similar to [mobx-react](https://github.com/mobxjs/mobx/tree/main/packages/mobx-react) and [mobx-react-component](https://github.com/xaviergonz/mobx-react) but has the following features:

* Not only re-rendering (Virtual DOM generation) by internal changes (changes in props)  , but also one by changes in props can be suppressed through MobX. You also have more control over the conditions of re-rendering for each props field. This improves performance and prevents the increased management costs required for performance tuning.
* @effect allows you to manage a cleanup in the similar way to useEffect. In addition, MobX automatically resolves dependencies, enabling more concise description.
* Provides functions such as @autorun and @watch for processing independently of React's life cycle.
* For backwards compatibility, state changes through setState are also managed by MobX and will be skipped if they have no impact on the Virtual DOM. This allows for a gradual migration from traditional code.
* Provides @context similar to useContext (planned)

### Comparison with hook API

The advantage of using MobX with React is that you can easily get the performance improvement techniques that you can get with react-hooks / exhaustive-deps just by using MobX. Unlike the hook API, MobX also supports memoization that accompanies conditional branch(if) and repeat(for), so it can handle more complicated cases and the code becomes simple and intuitive. Of course, there is a trade-off with the overhead of using MobX, but in many cases the benefits of reduced re-rendering (Virtual DOM generation) and code simplicity will outweigh the overhead of MobX. This is a widely accepted idea in Vue.js, but You can incorporate this idea into React.

In addition to this, mobx-react-class-comoponent can replace useEffect intuitively and smartly, as well as suppress re-rendering (Virtual DOM generation) due to changes in props during the `shouldComopnentUpdate` phase. You also have more control over the re-rendering conditions for each props field.

However, this library does not support the hook API. When using the hook API, we recommend the official MobX [mobx-react-lite](https://github.com/mobxjs/mobx/tree/main/packages/mobx-react-lite).

hook API | mobx-react-class-component | Advantages |
| ---- | ---- | ---- |
| useState | Normal mobx properties | Dependencies are automatically resolved. It is automatically memoized. |
| useMemo | Normal mobx properties | Dependencies are automatically resolved |
| useLayoutEffect | @effect | Dependencies are automatically resolved |
| useEffect | Substitute with @effect | Dependencies are automatically resolved |
| useCallback (no dependencies) | callback = () => {} | Concise |
| useCallback | @computed get () {dependencies; return () => {}} | None. Rather complicated |
| useRef | ref = observable.shallow (createRef) | It is possible to monitor ref changes |
| useContext | Not supported (planned to be supported) | None |
| useImperativeHandle | Not supported | |
| useDebugValue | Not supported | |

## Cenceptual Example

### Core APIs

```js
@component
class MyComponent extends React.Component {
  // Similar to the Hook API useEffect, but the dependencies are resolved automatically.
  @effect
  effectOnUpdate () {
    console.log ("effect on value updated", this.props.value);
    return () => {console.log ("disposed on next update or unmount");}
  }
  // If there are no dependencies, it will only be executed the first time and will be destroyed at the end
  @effect
  effectOnce () {
    console.log ("effect once", untracked (() => this.props.value));
    return () => {console.log ("disposed on unmount");}
  }
  // Technique to call only when a specific DOM changes
  ref = observable.shallow (React.createRef ());
  @effect
  effectRef () {
    console.log ("ref", this.ref.current);
    return () => {console.log ("disposed on unmount");}
  }

  // Compare the corresponding props to a deeper level and ignore them if they are the same
  // Also available as this.props.routeParams
  @prop.struct
  routeParams;

  // Do not make the corresponding props reactive.
  @prop.static
  repository;

  // Monitor the change of the corresponding field and run setState (for backward compatibility)
  @state
  stateValue;

  // Re-executed only when there is a change in the dependency
  @render
  render () {
    return <div>
       <div> this.props.value </ div>
       <div> this.state.stateValue </ div>
       <div ref = {this.ref}> show </ div>
    </ div>
  }
}
```

### low-level APIs

```js
@component
class MyComponent extends React.Component {
  // Similar to effect, but unlike effect, it is called immediately if there is a change without waiting for rendering
  @autorun
  valueChange {
    console.log ("value updated (immediate)", this.props.value);
    return () => {console.log ("disposed on next update or unmount");}
  }
  // Called immediately when the target property changes
  @watch (() => {
    console.log ("this.internalValue changed", this.internalValue)
  })
  @observable
  internalValue;
  @render
  render () {
    return <div>
       <div> this.props.value </ div>
       <div> this.state.stateValue </ div>
    </ div>
  }
}
```

## API

### @component
Initialize React Component.

### @render
Define the render function.

### @prop, @prop ("propName")
MobX will be notified that there is a change in this.prop.propName (default). Also, this.propName can be used as an alias for this.props.propName.

### @prop.struct, @prop.struct ("propName")
Compare props deeper and ignore them if they are the same.

> Attention: 
> Depending on whether you call in the MobX context or not, the value you get will vary. Note that `props.propName! = Untracked (() => this.props.propName)` can occur.

### @prop.deep, @prop.deep ("propName")
Alias ​​of @prop.struct

### @prop.static, @prop ("propName")
Instructs MobX not to monitor changes in prop.
The latest data can be accessed with this.props.propName as usual.

### @effect fieldName () => () => void;
Called after render is complete.
The handler is always called at first,
From the second time onwards, it will only be called when there is a change in the dependency.
The return value is used for cleanup and is called when the next effect is executed or unmounted.

### @autorun fieldName () => () => void;
The handler is always called at first,
The first time it is called in the constructor,
From the second time onwards, it will be called immediately (regardless of React's lifecycle) when there is a change in the dependency.
The return value is used for cleanup and is called when the next effect is executed or unmounted.

### @watch (fn: () => () => void, options: MobXReactionOption)
Called immediately (regardless of React's lifecycle) when the targeted field changes.
By default, the first time it is called in the constructor.
By specifying {fireImmediately: false} in option,
You can suppress calls in the constructor.
The return value is used for cleanup and is called when the next effect is executed or unmounted.
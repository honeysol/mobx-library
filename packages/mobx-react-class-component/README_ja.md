## 概要

MobXのReact.Componentへのbindingを実現します。

mobx-react, mobx-react-componentと似ていますが、
@effect, @autorun, @watch, @stateなど、
より柔軟で、パワフルな機能を提供します。

このライブラリは、hook APIには対応していません。
ただし、hook APIを使わなくても、
hook APIと同等のことができるという特徴があります。
hook APIを使う場合は、公式のmobx-react-liteで十分です。

* [mobx-react-lite](https://github.com/mobxjs/mobx/tree/main/packages/mobx-react-lite) for hook API
* [mobx-react](https://github.com/mobxjs/mobx/tree/main/packages/mobx-react) for Component API and hook API
* [mobx-react-component](https://github.com/xaviergonz/mobx-react-component) for Component API and hook API

## hook APIとの比較

| hook API | mobx-react-class-component | アドバンテージ |
| ---- | ---- | ---- |
| useState | 通常のmobxプロパティ or @state (for compatibility)  | 依存性が自動解決される |
| useMemo | 通常のmobxプロパティ | 依存性が自動解決される |
| useLayoutEffect | @effect | 依存性が自動解決される |
| useEffect | @effectで代用 | 依存性が自動解決される |
| useCallback | callback = () => {} (React) | パフォーマンス・可読性 |
| useRef | createRef (React) | |
| useContext | 未対応（対応予定） | |
| useImperativeHandle | 未対応 | |
| useDebugValue | 未対応 | |

### 主な機能

```js
@component
class MyComponent extends React.Component {
  // Hook APIのeffectと似ているが、依存性が自動で解決される。
  @effect
  effectOnUpdate() {
    console.log("effect on value updated", this.props.value);
    return () => { console.log("disposed on next update or unmount"); }
  }
  // 依存性がなければ、初回だけ実行され、最後に破棄される
  @effect
  effectOnce() {
    console.log("effect once", untracked(() => this.props.value));
    return () => { console.log("disposed on unmount"); }
  }
  // 特定のDOMが変化したときだけ呼び出される
  @effect
  effectRef() {
    console.log("ref", this.ref.current);
    return () => { console.log("disposed on unmount"); }
  }
  ref = observable(React.createRef());

　// 該当するpropsを深い階層まで比較して同じであったら無視する
  // this.props.routeParamsとしても利用可能
  @prop.struct
  routeParams;

  // 該当するpropsをリアクティブにしない
  @prop.static
  system;

  // 依存関係に変化があったときのみ、再実行される
  @render
  render() {
    return <div>
       <div>this.props.value</div>
       <div>this.state.stateValue</div>
       <div ref={this.ref}>show</div>
    </div>
  }
}
```

### 後方互換性のための機能

mobx-react-class-componentでは、
既存のReact.Componentコードと併用する形で、段階的に移行することができる。

```js
// component.legacy では、、propがリアクティブではないため、
// 手動で、@propでbindする必要がある。
@component.legacy
class MyComponent extends React.Component {
  // propをbindする。
  @prop
  value;
  // この値が変化すると、setStateを通してstateに反映される。
  @state.computed
  get(){
    this.value + 1;
  }
  // rendeはmobxを通してリアクティブではないが、stateを通して更新される。
  render() {
    return <div>
       <div>this.state.stateValue</div>
    </div>
  }
}
```

### low-level API

```js
@component
class MyComponent extends React.Component {
  // effectと似ているが、effectと異なり、renderingを待たずに変化があったらただちに呼ばれる
  @autorun(() => {
    console.log("value updated (immediate) ", this.props.value);
    return () => { console.log("disposed on next update or unmount"); }
  })
  // 対象のプロパティに変化があるとただちに呼ばれる
  @watch(() => {
    console.log("this.internalValue changed", this.internalValue)
  })

  @observable
  internalValue;
  @render
  render() {
    return <div>
       <div>this.props.value</div>
       <div>this.state.stateValue</div>
    </div>
  }
}
```
### @component
Add event hook to React.Component.


### @component.pure

When you use @component, 
## 概要

MobXのReact.Componentへのbindingを実現します。

mobx-react, mobx-react-componentと似ていますが、
これらのライブラリより柔軟で、パワフルな機能を提供します。

このライブラリは、hook APIには対応していません。
ただし、hook APIを使わなくても、
hook APIと同等のことができるという特徴があります。
hook APIを使う場合は、公式のmobx-react-liteで十分です。

* [mobx-react-lite](https://github.com/mobxjs/mobx/tree/main/packages/mobx-react-lite) for hook API
* [mobx-react](https://github.com/mobxjs/mobx/tree/main/packages/mobx-react) for Component API and hook API
* [mobx-react-component](https://github.com/xaviergonz/mobx-react-component) for Component API and hook API

## hook APIとの比較


| hook API | mobx-react-class-component | メリット |
| ---- | ---- | ---- |
| useState | 通常のmobxプロパティ or @state (for compatibility)  | 依存性が自動解決される |
| useEffect | @effect | 依存性が自動解決される |
| useContext | 将来対応予定 | |
| useCallback | 通常のメソッド | パフォーマンス |
| useMemo | 通常のmobxプロパティ | 依存性が自動解決される |
| useRef | 通常のプロパティ | パフォーマンス |


### 主な機能

```
@component
class MyComponent extends React.Component {
  // Hook APIのeffectと似ているが、依存性が自動で解決される。
  @effect
  showOnUpdate() {
    console.log("value updated", this.props.value);
    return () => { console.log("disposed on next update or unmount"); }
  }
  // 依存性がなければ、初回だけ実行され、最後に破棄される
  @effect
  showOnce() {
    console.log("one time", untracked(() => this.props.value););
    return () => { console.log("disposed on unmount"); }
  }
  // effectと似ているが、renderingと関係なく、変化があったらただちに呼ばれる
  @autorun(() => {
    console.log("value updated (immediate) ", this.props.value);
    return () => { console.log("disposed on next update or unmount"); }
  })
  // 対象のプロパティに変化があるとただちに呼ばれる
  @watch(() => {
    console.log("this.internalValue change", this.internalValue)
  })
  @observable
  internalValue;

  // propsを深い階層まで比較して取得する
  @prop.deep
  routeParams;

  // たとえば、refをobservableにして、effect内で使用すると、
  // DOMが変化したときだけサイドエフェクトを実行することができる。
  @observable
  ref = createRef();

  // 依存関係に変化があったときのみ、再実行される
  @render
  render() {
    return <div>
       <div>this.props.value</div>
       <div>this.state.stateValue</div>
    </div>
  }
}
```

### 後方互換性のための機能

mobx-react-class-componentでは、
既存のReact.Componentコードと併用する形で、段階的に移行することができる。

```
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

### @component
Add event hook to React.Component.


### @component.pure

When you use @component, 
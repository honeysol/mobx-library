## 概要

MobXのReact.Componentへのbindingです。

類似のライブラリやhook APIと比べてパフォーマンスの向上と記述の簡潔さを実現します。

### 類似のライブラリとの比較

[mobx-react](https://github.com/mobxjs/mobx/tree/main/packages/mobx-react)　や [mobx-react-component](https://github.com/xaviergonz/mobx-react-component)と似ていますが以下のような特徴があります。

* 内部的な変化だけではなく、propsの変化に伴う再レンダリング(Virtual DOMの生成)をMobXを通して抑制できます。また、propsのフィールドごとに再レンダリングの条件を詳細にコントロールすることができます。これによってパフォーマンスを向上させ、パフォーマンスチューニングに必要な、管理コストの増加を防ぎます。
* @effectでは、useEffectに似たクリーンナップを行えます。また、依存関係をMobXで自動で解決することで、より簡潔な記述を可能にします。
* @autorun, @watchなど、Reactのライフサイクルと独立に処理を行うための機能を提供します。
* 後方互換性のため、setStateを通したstateの変更も、MobXの管理対象となり、Virtual DOMへの影響がない場合は生成がスキップされます。このため、従来のコードからの段階的な移行が可能です。
* useContextと似た@contextを提供します（予定）

### hook APIとの比較

ReactでMobXを使うメリットは、react-hooks/exhaustive-depsで得られるようなパフォーマンス向上のテクニックを、MobXを使うだけで簡単に得られることです。MobXでは、hook APIと異なり、分岐や繰り返しに伴うmemo化にも対応しているため、より複雑なケースにも対応でき、コードも簡潔で直感的になります。もちろん、MobXを使うことそのものによるオーバーヘッドとのトレードオフではありますが、多くの場合、再レンダリング(Virtual DOMの生成)の抑制とコードの簡潔さのメリットは、MobXのオーバーヘッドを上回るでしょう。これは、Vue.jsで取り入れられ、広く受け入れられている考え方ですが、この考え方をReactに取り入れることができます。

mobx-react-class-comoponentでは、これに加えて、useEffectを直感的でスマートに代替できるだけでなく、propsの変化に伴う再レンダリング(Virtual DOMの生成)を`shouldComopnentUpdate`のフェーズで抑制できます。また、propsのフィールドごとに再レンダリングの条件を詳細にコントロールすることができます。

ただし、このライブラリは、hook APIには対応していません。hook APIを使う場合、MobX公式の[mobx-react-lite](https://github.com/mobxjs/mobx/tree/main/packages/mobx-react-lite)をおすすめします。

| hook API | mobx-react-class-component | アドバンテージ |
| ---- | ---- | ---- |
| useState | 通常のmobxプロパティ | 依存性が自動解決される。自動でメモ化される。 |
| useMemo | 通常のmobxプロパティ | 依存性が自動解決される |
| useLayoutEffect | @effect | 依存性が自動解決される |
| useEffect | @effectで代用 | 依存性が自動解決される |
| useCallback(依存性なし) | callback = () => {} | 簡潔 |
| useCallback(依存性あり) | @computed get() {dependencies; return () => {}} | なし。むしろ複雑 |
| useRef | ref = observable.shallow(createRef) | refの変更を監視することが可能 |
| useContext | 未対応（対応予定） | 特になし |
| useImperativeHandle | 未対応 | |
| useDebugValue | 未対応 | |

## Cenceptual Example

### Core APIs

```js
@component
class MyComponent extends React.Component {
  // Hook APIのuseEffectと似ているが、依存性が自動で解決される。
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
  // 特定のDOMが変化したときだけ呼び出すためのテクニック
  ref = observable.shallow(React.createRef());
  @effect
  effectRef() {
    console.log("ref", this.ref.current);
    return () => { console.log("disposed on unmount"); }
  }

　// 該当するpropsを深い階層まで比較して同じであったら無視する
  // this.props.routeParamsとしても利用可能
  @prop.struct
  routeParams;

  // 該当するpropsをリアクティブにしない
  @prop.static
  repository;

  // 該当するフィールドの変更を監視して、setStateする（後方互換性のため）
  @state
  stateValue;

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

### low-level APIs

```js
@component
class MyComponent extends React.Component {
  // effectと似ているが、effectと異なり、renderingを待たずに変化があったらただちに呼ばれる
  @autorun
  valueChange {
    console.log("value updated (immediate) ", this.props.value);
    return () => { console.log("disposed on next update or unmount"); }
  }
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

## API

### @component
React Componentを初期化します。

### @render
render関数を定義します。

### @prop, @prop("propName")
this.prop.propNameに変化があればMobXに通知されます（デフォルト）。また、this.props.propNameのエイリアスとして、this.propNameが使えるようになります。

### @prop.struct, @prop.struct("propName")
propを深い階層まで比較して、同一であれば無視します。

> 注意
> MobXのコンテクストとそうではない場合で、取得する値が変わります。this.props.propName != untracked(() => this.props.propName)となる場合があるので注意してください。

### @prop.deep, @prop.deep("propName")
Alias of @prop.struct

### @prop.static, @prop("propName")
propの変化をMobXの監視対象としないように指示します。
Mobの監視対象にならないだけで、最新のデータは、通常と同じように、this.props.propNameでアクセスすることができます。

### @effect fieldName() => () => void;
renderの完了後に呼ばれます。
ハンドラは、最初は必ず呼ばれ、
二度目以降は、依存関係に変化があったときのみに呼ばれます。
戻り値は、クリーンナップに使われ、次のeffectの実行または、unmount時に呼ばれます。

### @autorun fieldName() => () => void;
初回は、constructor内で呼ばれ、
二度目以降は、依存関係に変化があったときにただち(Reactのライフサイクルと無関係に)に呼ばれます。
戻り値は、クリーンナップに使われ、次のeffectの実行または、unmount時に呼ばれます。

### @watch(fn: () => () => void, options: MobXReactionOption)
該当するフィールドに変化があったときにただちに(Reactのライフサイクルと無関係に)呼ばれます。
デフォルトでは、初回はconstructor内で呼ばれます。
optionに { fireImmediately: false }を指定することで、
constructor内でもの呼び出しを抑制できます。
戻り値は、クリーンナップに使われ、次のeffectの実行または、unmount時に呼ばれます。
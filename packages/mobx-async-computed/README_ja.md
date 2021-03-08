## 概要

MobXのフィールドを非同期に解決します。非同期の順序処理の崩れを解決し、最新のpromiseに対応する結果だけを返します。

このライブラリは、初期化および終了のための特別な呼び出し元を必要としません。最初に参照された時点で、非同期の解決を開始し、参照がなくなった時点で非同期解決を終了します。代わりに、何らかのobserving source(observe, autorun, watch等)がなければ動作しません。

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

### @asyncComputeTo(propertyName: string)
Promiseを解決した値を、指定されたpropertyに代入します。propertyには通常、@observable.refを指定します。

### @asyncComputed
_Typescriptでは非推奨_

Promiseを解決した値を取得します。ただし、Typescriptでは、デコレータによる型の変更に対応していないため、型を調整するためには、resolveTypeを使う必要があります。実際の型と表現上の型が一致しなくなるため、Typescriptでは推奨しません。

### resolveType(value: T): ResolvedType<T>
_Typescriptでは非推奨_

与えられたPromiseを、そのまま返します。ただし、型だけは解決された型に偽装します。実際の型と表現上の型が一致しなくなるため、Typescriptでは推奨しません。
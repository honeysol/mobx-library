import {
  action,
  autorun,
  computed,
  configure,
  createAtom,
  getObserverTree,
  makeObservable,
  observable,
  runInAction,
  untracked,
} from "mobx";
import * as mobx from "mobx";
import {
  asyncComputed,
  asyncComputedFrom,
  asyncComputeTo,
  resolveType,
} from "mobx-async-computed";
import { becomeObserved } from "mobx-observed";
import {
  autorun as autorunDecorator,
  component,
  effect,
  prop,
  render,
  state,
} from "mobx-react-class-component";
import * as React from "react";
import { evacuate } from "ts-decorator-manipulator";

import { delay } from "./delay";

configure({
  enforceActions: "observed",
});

/* eslint-disable no-console */

class MobxStore {
  constructor(value) {
    this.value = value;
    // this.lazyValue = 0;
    makeObservable(this);
  }
  @observable
  value: number;

  // @asyncComputed
  // lazyValue() {
  //   return delay(1000, this.value);
  // }

  // @observable.ref
  // lazyValue: number;

  // @asyncComputeTo("lazyValue")
  // get lazyValuePromise() {
  //   return resolveType(delay(1000, this.value));
  // }

  @asyncComputedFrom("lazyValuePromise")
  lazyValue: number;

  @computed
  get lazyValuePromise() {
    return resolveType(delay(1000, this.value));
  }
}
// Object.defineProperty(MobxStore.prototype, "value", {
//   writable: true,
//   value: 0,
// });

const store = new MobxStore(300);

// @component
class MobxComponent2 extends React.Component<
  {
    value: number;
    store: MobxStore;
    valueObj: { value: number };
  },
  { stateValue?: number }
> {
  state = { stateValue: 0 };
  // value;
  // @prop
  // store;
  @render
  render() {
    console.log("MobxComponent2 render");
    return (
      <div>
        {/* <div>value: {this.props.value}</div>
        <div>lazyValue: {this.lazyValue}</div>
        <div>lazyStoreValue: {this.lazyStoreValue}</div> */}
      </div>
    );
  }
}

@component
class MobxComponent3 extends React.Component<
  {
    value: number;
    store: MobxStore;
    valueObj: { value: number };
  },
  { stateValue?: number }
> {
  state = { stateValue: 0 };
  get isMobxComponent2() {
    return true;
  }
  @prop.deep("valueObj")
  valueObj;

  // @asyncComputed
  // lazyValue() {
  //   return resolveType(delay(1000, this.props.value));
  // }

  // @asyncComputeTo("lazyValue")
  // get lazyValuePromise() {
  //   return delay(1000, this.props.value);
  // }
  // @observable
  // lazyValue = 10;

  @computed
  get lazyValuePromise() {
    return (async () => {
      const value = await delay(1000, this.props.value);
      return value;
    })();
  }
  @asyncComputedFrom("lazyValuePromise")
  lazyValue;

  @observable
  temp = 200;

  @computed
  get computed() {
    return 10;
  }

  // @asyncComputed
  // lazyValue() {
  //   return resolveType(delay(1000, this.props.value));
  // }
  // @computed
  // get lazyValuePromise() {
  //   return delay(1000, this.props.value);
  // }
  // @asyncComputedFrom("lazyValuePromise")
  // lazyValue() {
  //   return resolveType(delay(1000, this.props.value));
  // }

  @asyncComputed
  lazyStoreValue() {
    if (!this.props.store) console.error(this, this.props.store);
    return resolveType(delay(1000, this.props.store?.value));
  }

  constructor(props) {
    super(props);
    this.internalValue = 0;
    // Object.defineProperty(this, "lazyValue", { writable: true, value: -1 });
    // this.lazyValue = 0;
  }
  get isMobxComponent3() {
    return true;
  }

  @observable.ref
  internalValue;

  @asyncComputed
  get lazyInternalValue() {
    return delay(1000, this.internalValue);
  }

  // @computed
  // get lazyInternalValuePromise() {
  //   console.log("lazyInternalValuePromise called");
  //   return delay(1000, this.internalValue);
  // }
  // @asyncComputedFrom("lazyInternalValuePromise")
  // lazyInternalValue;

  @observable
  internalStore = new MobxStore(0);
  // @asyncComputed
  // lazyInternalStore() {
  //   return delay(1000, this.internalStore. + 1);
  // }
  ref = observable(React.createRef<HTMLDivElement>());

  @effect
  effect1() {
    const value = untracked(() => this.props.value);
    console.log("effect once", value);
  }
  @effect
  effect2() {
    console.log("effect this.internalValue", this.internalValue);
  }
  @effect
  effect3() {
    const lazyInternalValue = this.lazyInternalValue;
    console.log("effect this.lazyInternalValue", this.lazyInternalValue);
    return () => {
      console.log(
        "effect cancel: this.lazyInternalValue (old)",
        lazyInternalValue
      );
    };
  }
  @effect
  effectRef() {
    console.log("effect ref", this.ref.current);
  }
  @autorunDecorator
  effect4() {
    console.log("autorun this.internalValue", this.internalValue);
  }
  @observable.ref
  showRef = false;

  @render
  render() {
    window.mobxComponent3 = this;
    console.log("MobxComponent3 render", Date.now(), this);
    return (
      <div>
        <div>value: {this.props.value}</div>
        <div>lazyValue: {this.lazyValue}</div>
        <div>props.valueObj.value: {this.props.valueObj.value}</div>
        <div>internalValue: {this.internalValue}</div>
        <div>lazyInternalValue: {this.lazyInternalValue}</div>
        <div>props.store: {this.props.store.value}</div>
        <div>lazyStoreValue: {this.lazyStoreValue}</div>
        <div>internalStore?.value: {this.internalStore?.value}</div>
        <div>internalStore?.lazyValue: {this.internalStore?.lazyValue}</div>
        <div>state.stateValue: {this.state.stateValue}</div>
        <button
          onClick={() => {
            runInAction(() => {
              this.internalValue = this.internalValue + 10;
            });
          }}
        >
          increment internalValue by mobx
        </button>
        <button
          onClick={() => {
            runInAction(() => {
              this.props.store.value = this.props.store.value + 100;
            });
          }}
        >
          increment props.store by mobx
        </button>
        <button
          onClick={() => {
            runInAction(() => {
              this.internalStore.value = this.internalStore.value + 1;
            });
          }}
        >
          increment internalStore by mobx
        </button>
        <button
          onClick={() => {
            runInAction(() => {
              this.internalStore = new MobxStore(0);
            });
          }}
        >
          replace internalStore by mobx
        </button>
        <button
          onClick={() => {
            this.setState({
              stateValue: (this.state.stateValue || 0) + 1,
            });
          }}
        >
          increment via state
        </button>
        <button
          onClick={() => {
            runInAction(() => {
              this.showRef = !this.showRef;
            });
          }}
        >
          toggle ref
        </button>
        {this.showRef && <span ref={this.ref}>show</span>}
      </div>
    );
  }
  componentDidUpdate() {
    console.log(this.ref.current);
  }
}
// Object.defineProperty(MobxComponent3.prototype, "lazyValue", {
//   value: 10,
//   writable: true,
// });
Object.defineProperty(MobxStore.prototype, "internalValue", {
  writable: true,
  value: 200,
});

export class App extends React.Component {
  state = { value: 300, valueObj: { value: 400 }, store };
  onUpdateValue = () => {};
  render() {
    console.log("App.render");
    return (
      <div>
        <MobxComponent3
          value={this.state.value}
          store={this.state.store}
          valueObj={this.state.valueObj}
        ></MobxComponent3>
        <button
          onClick={() => {
            this.setState({ value: this.state.value + 1 });
          }}
        >
          increment value by external props
        </button>
        <button
          onClick={() => {
            this.setState({
              valueObj: { value: this.state.valueObj.value },
            });
          }}
        >
          replace valueObj without structural change by external props
        </button>

        <button
          onClick={() => {
            this.setState({
              store: new MobxStore(0),
            });
          }}
        >
          replace store by external props
        </button>
      </div>
    );
  }
}

const methodDecorator: any = (
  target: object,
  propertyKey: string,
  desciptor: PropertyDescriptor
) => {
  console.log("methodDecorator", propertyKey, desciptor);
  return {
    get() {
      return "methodDecorator";
    },
    set() {},
  };
};

const propertyDecorator: PropertyDecorator = (
  target: object,
  propertyKey: string
) => {
  console.log("propertyDecorator", propertyKey);
  return {
    get(): any {
      return "propertyDecorator";
    },
  };
};

export class X {
  @methodDecorator
  @methodDecorator
  // @observable
  @propertyDecorator
  x = 100;
  // @methodDecorator
  // @methodDecorator
  // @computed
  // get a() {
  //   return 10;
  // }
  // @(becomeObserved.observable(() => {
  //   console.log("start observe");
  //   return () => console.log("end observe");
  // }) as PropertyDecorator)

  // @becomeObserved.observable(() => {
  //   console.log("start observe");
  //   return () => console.log("end observe");
  // })
  @(becomeObserved(() => {
    console.log("start observe");
    return () => console.log("end observe");
  }) as any)
  @evacuate(computed as any, "##")
  get y() {
    return Date.now();
  }

  @observable
  z = { a: 100 };
}

const x = new X();
const canceler = autorun(() => {
  console.log("x.y", x.y);
  console.log("x.z.a", x.z?.a);
});

// autorun(() => {
//   console.log("x.y", x.y);
//   // console.log("x.z", x.z);
//   console.log("x.z.b", x.z?.b);
// });

// console.log("#1");
console.log("should cancel");
canceler();
// console.log("#2");
// console.log("x", x);

declare let window: any;

window.x = x;
window.mobx = mobx;

// const counter = observable({ count: 0 });

// // Sets up the autorun and prints 0.
// window.test = () => {
//   for (let i = 0; i < 1000000; ++i) {
//     createAtom("#" + i);
//   }
// };

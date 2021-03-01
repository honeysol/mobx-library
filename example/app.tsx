import {
  action,
  autorun,
  computed,
  configure,
  createAtom,
  getObserverTree,
  observable,
  runInAction,
  untracked,
} from "mobx";
import { asyncComputed } from "mobx-async-computed";
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
  }
  @observable
  value: any;
  @asyncComputed
  lazyValue() {
    return delay(1000, this.value);
  }
}

const store = new MobxStore(300);

@component.smart
class MobxComponent2 extends React.Component<{
  value: number;
  store: MobxStore;
}> {
  state = {};
  get isMobxComponent2() {
    return true;
  }
  static isMobxComponent2Constructor = true;

  // @prop
  // value;
  // @prop
  // store;
  @render
  render() {
    console.log("MobxComponent2 render");
    return (
      <div>
        <div>value: {this.props.value}</div>
        <div>lazyValue: {this.lazyValue}</div>
        <div>lazyStoreValue: {this.lazyStoreValue}</div>
      </div>
    );
  }
  @asyncComputed
  lazyValue() {
    return delay(1000, this.props.value);
  }
  @asyncComputed
  lazyStoreValue() {
    if (!this.props.store) console.error(this, this.props.store);
    return delay(1000, this.props.store?.value);
  }
}

@component.smart
class MobxComponent3 extends MobxComponent2 {
  constructor(props) {
    super(props);
  }
  get isMobxComponent3() {
    return true;
  }
  @observable
  internalValue = 200;
  @asyncComputed
  lazyInternalValue() {
    return delay(1000, this.internalValue + 1);
  }
  @observable
  internalStore = new MobxStore(0);
  // @asyncComputed
  // lazyInternalStore() {
  //   return delay(1000, this.internalStore. + 1);
  // }
  ref = React.createRef<HTMLDivElement>();

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
  @autorunDecorator
  effect4() {
    console.log("autorun this.internalValue", this.internalValue);
  }

  @render
  render() {
    console.log("MobxComponent3 render", Date.now());
    return (
      <div ref={this.ref}>
        <div>value: {this.props.value}</div>
        <div>lazyValue: {this.lazyValue}</div>
        <div>internalValue: {this.internalValue}</div>
        <div>lazyInternalValue: {this.lazyInternalValue}</div>
        {/* <div>storeValue: {this.store?.value}</div> */}
        <div>lazyStoreValue: {this.lazyStoreValue}</div>
        <div>internalStoreValue: {this.internalStore?.value}</div>
        <div>lazyInternalStoreValue: {this.internalStore?.lazyValue}</div>
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
          increment store by mobx#
        </button>
        <button
          onClick={() => {
            runInAction(() => {
              this.internalStore.value = this.internalStore.value + 1;
            });
          }}
        >
          increment internalStore by mobx
        </button>{" "}
        <button
          onClick={() => {
            runInAction(() => {
              this.internalStore = new MobxStore(0);
            });
          }}
        >
          replace internalStore by mobx
        </button>
      </div>
    );
  }
  componentDidUpdate() {
    console.log(this.ref.current);
  }
}

export class App extends React.Component {
  state = { value: 300, store };
  onUpdateValue = () => {};
  render() {
    console.log("App.render");
    return (
      <div>
        <MobxComponent3
          value={this.state.value}
          store={this.state.store}
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
window.debug = { computed };

// const counter = observable({ count: 0 });

// // Sets up the autorun and prints 0.
// window.test = () => {
//   for (let i = 0; i < 1000000; ++i) {
//     createAtom("#" + i);
//   }
// };

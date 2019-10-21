import "babel-polyfill";
import React from "react";
import ReactDOM from "react-dom";
import { observable, configure, runInAction, computed } from "mobx";
import { asyncComputed } from "@/mobx-async-computed";
import { component, prop, render } from "@/mobx-react-component";
import * as mobx from "mobx";

window.mobx = mobx;

import { delay } from "delay";

// configure({
//   enforceActions: "always",
// });

window.runInAction = runInAction;

class MobxStore {
  constructor(value) {
    runInAction(() => {
      this.value = value;
    });
  }
  @observable
  value;
}

const store = new MobxStore(300);

window.MobxStore = MobxStore;

@component
class MobxComponent2 extends React.Component {
  state = {};
  get isMobxComponent2() {
    return true;
  }
  static isMobxComponent2Prototype = true;

  @observable
  params = {};
  @prop.observable
  value = 100;
  @prop.observable
  store;
  render() {
    return (
      <div>
        <div>value: {this.value}</div>
        <div>lazyValue: {this.lazyValue}</div>
      </div>
    );
  }
  @prop.observable
  dammy = "dammyValue";

  @asyncComputed
  get lazyValue() {
    return delay(1000, this.value);
  }
  @asyncComputed
  get lazyStoreValue() {
    if (!this.store) console.error(this);

    return delay(1000, this.store && this.store.value + 1);
  }
}
@component
class MobxComponent3 extends MobxComponent2 {
  isMobxComponent3 = true;
  static isMobxComponent3Prototype = true;

  @observable
  internalValue = 200;

  @asyncComputed
  get lazyDammy() {
    return delay(1000, this.dammy + 1);
  }

  @asyncComputed
  get lazyInternalValue() {
    return delay(1000, this.internalValue + 1);
  }

  @render
  get rendered() {
    console.error("MobxComponent3 render");
    return (
      <div>
        <div>value: {this.value}</div>
        <div>lazyValue: {this.lazyValue}</div>
        <div>internalValue: {this.internalValue}</div>
        <div>lazyInternalValue: {this.lazyInternalValue}</div>
        <div>storeValue: {this.store && this.store.value}</div>
        <div>lazyStoreValue: {this.lazyStoreValue}</div>
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
              this.value = this.value + 10;
            });
          }}
        >
          increment value by mobx
        </button>
        <button
          onClick={() => {
            runInAction(() => {
              this.store.value = this.store.value + 100;
            });
          }}
        >
          increment store by mobx
        </button>
        <button
          onClick={() => {
            runInAction(() => {
              this.store = new MobxStore(this.store.value + 10);
            });
          }}
        >
          replace store by mobx
        </button>
      </div>
    );
  }
}

class App extends React.Component {
  state = { value: 300, dammy: "dammyValue", store };
  onUpdateValue = () => {};
  render() {
    console.log("App.render");
    return (
      <div>
        <MobxComponent3
          ref="target"
          params={{}}
          value={this.state.value}
          dammy={this.state.dammy}
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
            this.setState({ dammy: this.state.value + 1 });
          }}
        >
          increment dammy by external props
        </button>
        <button
          onClick={() => {
            this.setState({ store: new MobxStore(this.state.store.value + 1) });
          }}
        >
          replace store by external props
        </button>
      </div>
    );
  }
  componentDidMount() {
    window.target = this.refs.target;
    window.app = this;
  }
}
const targetElement = (() => {
  const element = document.createElement("div");
  document.body.insertAdjacentElement("afterbegin", element);
  return element;
})();
ReactDOM.render(<App />, targetElement);

console.log({
  // Base: Base.prototype,
  MobxComponent2: MobxComponent2.prototype,
  MobxComponent3: MobxComponent3.prototype,
});

class Sample {
  @observable
  array = [];
  @observable
  object = {};
  @observable.ref
  objectRef = {};
  @computed
  get _array() {
    return this.array.slice();
  }
  @computed
  get _object() {
    return Object.values(this.object);
  }
  @computed
  get _objectRef() {
    return Object.values(this.objectRef);
  }
}

// const sample = new Sample();
// mobx.autorun(() => {
//   sample.array;
//   console.log("autorun array");
// });
// mobx.autorun(() => {
//   sample._array;
//   console.log("autorun _array");
// });
// mobx.autorun(() => {
//   sample.array.slice();
//   console.log("autorun array.slice()");
// });

// mobx.observe(sample, "array", change => console.log("observe array"));
// mobx.observe(sample, "_array", change => console.log("observe _array"));

// window.sample = sample;
// sample.array.push(1);

const sample = new Sample();
mobx.autorun(() => {
  sample.object;
  console.log("autorun object");
});
mobx.autorun(() => {
  sample.objectRef;
  console.log("autorun objectRef");
});
mobx.autorun(() => {
  sample._object;
  console.log("autorun _object");
});
mobx.autorun(() => {
  sample._objectRef;
  console.log("autorun _objectRef");
});

mobx.observe(sample, "object", change => console.log("observe object"));
mobx.observe(sample, "objectRef", change => console.log("observe objectRef"));
mobx.observe(sample, "_object", change => console.log("observe _object"));
mobx.observe(sample, "_objectRef", change => console.log("observe _objectRef"));

window.sample = sample;
sample.array.push(1);

@component
class MobxComponent4 extends React.Component {
  state = {};
  @observable
  value = 100;
  @asyncComputed
  get lazyValue() {
    console.log("lazyValue");
    return delay(1000, this.value);
  }
}

window.mobxComponent4 = new MobxComponent4();

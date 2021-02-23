import { computed, configure, observable, runInAction } from "mobx";
import * as mobx from "mobx";
import { asyncComputed } from "mobx-async-computed";
import { component, prop, render, state } from "mobx-react-class-component";
import * as React from "react";
import * as ReactDOM from "react-dom";

/* eslint-disable no-console */

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

// window.sample = sample;
// sample.array.push(1);

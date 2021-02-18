import { computed, observable, observe } from "mobx";
import { addHandler, combinePropertyDecorator } from "mobx-initializer";

import { componentStatus } from "./component";

const _state = (target: object, fieldName: string) => {
  const cancelObserveFieldname = Symbol("_observe_" + fieldName);

  addHandler(target, "stateRegister", function(this: any) {
    this[cancelObserveFieldname] = observe(this, fieldName, () => {
      if (this[componentStatus] === "mounted") {
        this.setState({ [fieldName]: this[fieldName] });
      }
    });
    this.state = this.state || { dammy: "###" };
    this.state[fieldName] = this[fieldName];
  });
  addHandler(target, "release", function(this: any) {
    this[cancelObserveFieldname]();
  });
};

export const state = _state as typeof _state & {
  computed: MethodDecorator & {
    struct: MethodDecorator;
  };
  observable: MethodDecorator;
  deep: MethodDecorator;
  shallow: MethodDecorator;
  ref: MethodDecorator;
  struct: MethodDecorator;
};

state.computed = combinePropertyDecorator(
  computed,
  _state as PropertyDecorator
) as PropertyDecorator & {
  struct: PropertyDecorator;
};
state.computed.struct = combinePropertyDecorator(
  computed.struct,
  _state as PropertyDecorator
);
state.observable = combinePropertyDecorator(
  observable.ref,
  _state as PropertyDecorator
);
state.deep = combinePropertyDecorator(
  observable.deep,
  _state as PropertyDecorator
);
state.shallow = combinePropertyDecorator(
  observable.shallow,
  _state as PropertyDecorator
);
state.ref = combinePropertyDecorator(
  observable.ref,
  _state as PropertyDecorator
);
state.struct = combinePropertyDecorator(
  observable.struct,
  _state as PropertyDecorator
);

export class X {
  @state
  x = 0;
}

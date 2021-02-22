import { computed, observable } from "mobx";
import { combinePropertyDecorator } from "mobx-initializer";

import { componentStatus } from "./component";
import { watch } from "./watch";

const _state = (target: object, fieldName: string) => {
  return watch(function(this: any) {
    if (this[componentStatus] === "mounted") {
      this.setState({ [fieldName]: this[fieldName] });
    } else {
      this.state = this.state || {};
      this.state[fieldName] = this[fieldName];
    }
  })(target, fieldName);
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

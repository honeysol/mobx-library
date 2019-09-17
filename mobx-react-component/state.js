import { observe, observable, computed } from "mobx";
import { addHandler, combineDecorator } from "../mobx-initializer/util";

const _state = (target, fieldName, descriptor) => {
  addHandler(target, "stateRegister", function(props) {
    observe(this, fieldName, () => {
      if (this.status === "mounted") {
        this.setState({ [fieldName]: this[fieldName] });
      }
    });
  });
};

export const state = combineDecorator(computed, _state);

state.computed = combineDecorator(computed, _state);
state.computed.struct = combineDecorator(computed.struct, _state);
state.observable = combineDecorator(observable.deep, _state);
state.deep = combineDecorator(observable.deep, _state);
state.shallow = combineDecorator(observable.shallow, _state);
state.ref = combineDecorator(observable.ref, _state);
state.struct = combineDecorator(observable.struct, _state);

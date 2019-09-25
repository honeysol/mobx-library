import { addHandler, combineDecorator } from "../mobx-initializer/util";
import { state } from "./state";

const _render = (target, fieldName, descriptor) => {
  addHandler(target, "init", function(props) {
    if (target.hasOwnProperty("render")) {
      console.warn(
        "render decorator is used but render method is already implemented",
        this
      );
    }
    this.render = function() {
      return this[fieldName];
    };
  });
};

export const render = combineDecorator(state.computed, _render);

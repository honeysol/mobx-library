import { addHandler, combineDecorator } from "../mobx-initializer/util";
import { state } from "./state";
import * as crypto from "crypto";

// エラーの原因: combineDecoratorの扱いがおかしい

const _render = (target, fieldName, descriptor) => {
  if (fieldName === "render") {
    const fieldId = fieldName + crypto.randomBytes(8).toString("hex");
    Object.defineProperty(
      target,
      fieldId,
      state.computed(target, fieldId, descriptor)
    );
    return {
      configurable: true,
      value() {
        return this[fieldId];
      },
    };
  } else {
    addHandler(target, "init", function(props) {
      this.render = function() {
        return this[fieldName];
      };
    });
    return state.computed(target, fieldName, descriptor);
  }
};

export const render = _render;

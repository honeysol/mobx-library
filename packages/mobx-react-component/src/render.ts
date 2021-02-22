import { state } from "./state";
import { getDerivedPropertyString } from "./util";

export const render = (
  target: object,
  fieldName: string | symbol,
  descriptor: PropertyDescriptor
) => {
  if (fieldName === "render") {
    const fieldId = getDerivedPropertyString("render", "original");
    state.computed(target, fieldId, {
      get: descriptor.value,
    });
    return {
      configurable: true,
      value(this: any) {
        return this[fieldId];
      },
    };
  } else {
    Object.defineProperty(target, "render", {
      value() {
        return this[fieldName];
      },
    });
    return state.computed(target, fieldName, {
      get: descriptor.get || descriptor.value,
    });
  }
};

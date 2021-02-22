import * as crypto from "crypto";

import { state } from "./state";

export const render = (
  target: object,
  fieldName: string,
  descriptor: PropertyDescriptor
) => {
  if (fieldName === "render") {
    const fieldId = fieldName + crypto.randomBytes(8).toString("hex");
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

import { state } from "./state";
import { getDerivedPropertyString } from "./util";

export const render = (
  target: object,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor
) => {
  if (propertyKey === "render") {
    const fieldId = getDerivedPropertyString("render", "original");
    state.computed(target, fieldId, {
      get: descriptor.value,
    });
    return {
      configurable: true,
      value(this: any) {
        return this[fieldId];
      },
    } as PropertyDescriptor;
  } else {
    Object.defineProperty(target, "render", {
      value() {
        return this[propertyKey];
      },
    });
    return state.computed(target, propertyKey, {
      get: descriptor.get || descriptor.value,
    }) as PropertyDescriptor;
  }
};

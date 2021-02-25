import { evacuate } from "ts-decorator-manipulator";

import { state } from "./state";

export const render = (
  target: object,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor
) => {
  if (propertyKey === "render") {
    const originalDescriptor = evacuate(state.computed, "original")(
      target,
      propertyKey,
      {
        get: descriptor.value,
      }
    );
    return {
      value(this: any) {
        return originalDescriptor.get.call(this);
      },
    } as PropertyDescriptor;
  } else {
    const originalDescriptor = state.computed(target, propertyKey, {
      get: descriptor.get || descriptor.value,
    }) as PropertyDescriptor;
    Object.defineProperty(target, "render", {
      value() {
        return originalDescriptor.get?.call(this);
      },
    });
    return originalDescriptor;
  }
};

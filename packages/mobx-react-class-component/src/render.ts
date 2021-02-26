import { evacuate } from "ts-decorator-manipulator";

import { state } from "./state";
import { WatchOption } from "./watch";
export const render = (
  target: object,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor
) => {
  if (propertyKey === "render") {
    const originalDescriptor = evacuate(
      state.computed({
        propertyKey: "render",
      } as WatchOption),
      "original"
    )(target, propertyKey, {
      get: descriptor.value,
    });
    return {
      value(this: any) {
        return originalDescriptor.get.call(this);
      },
    } as PropertyDescriptor;
  } else {
    const originalDescriptor = state.computed({
      propertyKey: "render",
    } as WatchOption)(target, propertyKey, {
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

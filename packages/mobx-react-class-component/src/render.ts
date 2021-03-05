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
        annotation: false,
      } as WatchOption),
      "original"
    )(target, propertyKey, {
      get: descriptor.value,
    });
    return {
      value(this: any) {
        const children = originalDescriptor.get?.call(this);
        this.notifyRender?.(children);
        return children;
      },
    } as PropertyDescriptor;
  } else {
    const originalDescriptor = state.computed({
      propertyKey: "render",
      annotation: false,
    } as WatchOption)(target, propertyKey, {
      get: descriptor.get || descriptor.value,
    }) as PropertyDescriptor;
    Object.defineProperty(target, "render", {
      value() {
        const children = originalDescriptor.get?.call(this);
        this.notifyRender?.(children);
        return children;
      },
    });
    return originalDescriptor;
  }
};

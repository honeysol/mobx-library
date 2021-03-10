import { evacuate } from "ts-decorator-manipulator";

import { addUpdator } from "./component";
import { intercept } from "./intercept";

export const effect = (
  target: object,
  propertyKey: string | symbol,
  descriptor: any
) => {
  const computedDescriptor: any = evacuate(
    intercept.computed.autoclose(canceler => canceler()),
    "effect"
  )(target, propertyKey, {
    get: descriptor.value,
  });
  addUpdator(
    target,
    function(this: any) {
      return computedDescriptor.get.call(this);
    },
    propertyKey
  );
  return computedDescriptor;
};

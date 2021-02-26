import { computed } from "mobx";

import { addUpdator } from "./component";
export const effect = (
  target: object,
  propertyKey: string | symbol,
  descriptor: any
) => {
  const computedDescriptor = computed({ keepAlive: true })(
    target,
    propertyKey,
    {
      get: descriptor.get || descriptor.value,
    }
  );
  addUpdator(target, function(this: any) {
    return computedDescriptor.get.call(this);
  });
  return computedDescriptor;
};

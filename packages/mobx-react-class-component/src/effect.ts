import { addUpdator } from "./component";
import { intercept } from "./intercept";
export const effect = (
  target: object,
  propertyKey: string | symbol,
  descriptor: any
) => {
  const computedDescriptor: any = intercept.computed.autoclose(canceler =>
    canceler()
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

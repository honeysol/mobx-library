import { AsyncCommitter } from "./asyncCommitter";
import { demand } from "./demand";
import { getDerivedPropertyKey } from "./util";

export const asyncComputed = (
  target: object,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor
) => {
  const asyncCommitterKey = getDerivedPropertyKey(
    propertyKey,
    "asyncCommitter"
  );
  return demand({
    async change(this: any, { newValue }, setter) {
      const asyncCommiter = (this[asyncCommitterKey] =
        this[asyncCommitterKey] || new AsyncCommitter());
      const { successed, value } = await asyncCommiter.resolve(newValue);
      if (successed) {
        setter(value);
      }
    },
  })(target, propertyKey, descriptor);
};

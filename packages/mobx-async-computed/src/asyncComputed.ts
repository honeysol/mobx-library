import { AsyncCommitter } from "./asyncCommitter";
import { demand } from "./demand";
import { getDerivedPropertyKey } from "./util";

export const asyncComputed = (
  target: object,
  fieldName: string | symbol,
  descriptor: PropertyDescriptor
) => {
  const asyncCommitterFieldName = getDerivedPropertyKey(
    fieldName,
    "asyncCommitter"
  );
  return demand({
    async change(this: any, { newValue }, setter) {
      const asyncCommiter = (this[asyncCommitterFieldName] =
        this[asyncCommitterFieldName] || new AsyncCommitter());
      const { successed, value } = await asyncCommiter.resolve(newValue);
      if (successed) {
        setter(value);
      }
    },
  })(target, fieldName, descriptor);
};

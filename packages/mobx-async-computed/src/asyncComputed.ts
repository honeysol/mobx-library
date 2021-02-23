import { observed } from "mobx-observed";
import { getDerivedPropertyKey } from "ts-decorator-manipulator";

import { AsyncCommitter } from "./asyncCommitter";

export const asyncComputed = (
  target: object,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor
) => {
  const asyncCommitterKey = getDerivedPropertyKey(
    propertyKey,
    "asyncCommitter"
  );
  return observed({
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

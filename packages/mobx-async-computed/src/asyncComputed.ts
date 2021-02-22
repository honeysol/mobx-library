import * as crypto from "crypto";

import { AsyncCommitter } from "./asyncCommitter";
import { demand } from "./demand";

export const asyncComputed = (
  target: object,
  fieldName: string,
  descriptor: PropertyDescriptor
) => {
  const fieldId = fieldName + crypto.randomBytes(8).toString("hex");
  const asyncCommitterFieldName = fieldId + "AsyncCommitter(asyncComputed)";
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

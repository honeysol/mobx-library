import { autorun as mobxAutorun } from "mobx";
import { addHandler } from "mobx-initializer";

import { getDerivedPropertyKey } from "./util";

export const autorun = (
  target: object,
  propertyKey: string | symbol,
  descriptor: any
) => {
  const cancelAutoRunKey = getDerivedPropertyKey(propertyKey, "cancelAutorun");
  addHandler(target, "init", function(this: any) {
    this[cancelAutoRunKey] = mobxAutorun(this[propertyKey].bind(this));
  });
  addHandler(target, "release", function(this: any) {
    this[cancelAutoRunKey]();
  });
  return descriptor;
};

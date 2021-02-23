import { autorun as mobxAutorun } from "mobx";
import { getDerivedPropertyKey } from "ts-decorator-manipulator";

import { addHandler } from "./component";

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

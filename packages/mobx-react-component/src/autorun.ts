import { autorun as mobxAutorun } from "mobx";
import { addHandler } from "mobx-initializer";

export const autorun = (target: object, fieldName: string, descriptor: any) => {
  const cancelAutoRunFieldname = Symbol("_autorun_" + fieldName);
  addHandler(target, "init", function(this: any) {
    this[cancelAutoRunFieldname] = mobxAutorun(this[fieldName].bind(this));
  });
  addHandler(target, "release", function(this: any) {
    this[cancelAutoRunFieldname]();
  });
  return descriptor;
};

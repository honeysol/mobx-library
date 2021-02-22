import { autorun as mobxAutorun } from "mobx";
import { addHandler } from "mobx-initializer";

import { getDerivedPropertyKey } from "./util";

export const autorun = (
  target: object,
  fieldName: string | symbol,
  descriptor: any
) => {
  const cancelAutoRunFieldName = getDerivedPropertyKey(
    fieldName,
    "cancelAutorun"
  );
  addHandler(target, "init", function(this: any) {
    this[cancelAutoRunFieldName] = mobxAutorun(this[fieldName].bind(this));
  });
  addHandler(target, "release", function(this: any) {
    this[cancelAutoRunFieldName]();
  });
  return descriptor;
};

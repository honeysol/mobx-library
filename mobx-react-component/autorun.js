import { autorun as mobxAutorun } from "mobx";
import { addHandler } from "../mobx-initializer/util";

export const autorun = watchFieldName => (target, fieldName, descriptor) => {
  const cancelAutoRunFieldname = Symbol("_autorun_" + fieldName);
  addHandler(target, "stateRegister", function(props) {
    this[cancelAutoRunFieldname] = mobxAutorun(this[fieldName].bind(this));
  });
  addHandler(target, "release", function(props) {
    this[cancelAutoRunFieldname]();
  });
  return descriptor;
};

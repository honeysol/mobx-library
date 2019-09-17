import { applyHandlerOnce } from "./util";

const appliedFlag = Symbol("isAppliedMobxInitializer");

export const initializer = (target, ...args) => {
  if (target.prototype[appliedFlag]) {
    return target;
  }
  return class initializer extends target {
    [appliedFlag] = true;
    constructor(props) {
      super(props);
      applyHandlerOnce(this, "init", props);
    }
  };
};

import { applyHandlerOnce } from "./util";
export * from "./util";

const appliedFlag = Symbol("isAppliedMobxInitializer");

export const initializer = (target, ...args) => {
  if (target.prototype[appliedFlag]) {
    return target;
  }
  return class Initializer extends target {
    [appliedFlag] = true;
    constructor(props) {
      super(props);
      applyHandlerOnce(this, "init", props);
    }
  };
};

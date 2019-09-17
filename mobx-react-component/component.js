import { initializer } from "../mobx-initializer";

import {
  applyHandler,
  applyHandlerOnce,
  combineDecorator,
} from "../mobx-initializer/util";

const appliedFlag = Symbol("isAppliedMobxReactComponentItializer");

const _component = (target, ...args) => {
  if (target.prototype[appliedFlag]) {
    return target;
  }
  return class ini_componenttializer extends target {
    [appliedFlag] = true;
    constructor(props) {
      super(props);
      applyHandlerOnce(this, "propUpdate", props);
      applyHandlerOnce(this, "stateRegister", props);
    }
    shouldComponentUpdate(nextProps, nextState) {
      if (nextProps !== this.props) {
        if (!this._shouldComponentUpdateInAction) {
          this._shouldComponentUpdateInAction = true;
          applyHandler(this, "propUpdate", nextProps);
        }
      }
      const result = super.shouldComponentUpdate
        ? super.shouldComponentUpdate(nextProps)
        : true;
      this._shouldComponentUpdateInAction = false;
      return result;
    }
    componentDidMount() {
      this.status = "mounted";
    }
    componentWillUnmount() {
      applyHandlerOnce(this, "release");
    }
  };
};

export const component = combineDecorator(initializer, _component);

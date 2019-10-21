import { observable } from "mobx";

import { initializer } from "../mobx-initializer";

import {
  applyHandler,
  applyHandlerOnce,
  combineDecorator,
  componentStatus,
} from "../mobx-initializer/util";

const appliedFlag = Symbol("isAppliedMobxReactComponentItializer");

const _component = (target, ...args) => {
  if (target.prototype[appliedFlag]) {
    return target;
  }
  return class component extends target {
    [appliedFlag] = true;
    @observable.ref
    props;
    constructor(props) {
      super(props);
      applyHandlerOnce(this, "stateRegister", props);
      applyHandlerOnce(this, "resourceRegister", props);
    }
    componentDidMount() {
      this[componentStatus] = "mounted";
    }
    componentWillUnmount() {
      applyHandlerOnce(this, "release");
    }
  };
};

export const component = combineDecorator(initializer, _component);

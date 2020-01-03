import { observable } from "mobx";

import { initializer } from "../mobx-initializer";

import {
  applyHandlerOnce,
  combineDecorator,
  componentStatus,
} from "../mobx-initializer/util";

const componentAppliedFlag = Symbol("isAppliedMobxReactComponentInitializer");
const pureComponentAppliedFlag = Symbol(
  "isAppliedMobxReactPureComponentInitializer"
);

const _component = target => {
  if (target.prototype[componentAppliedFlag]) {
    return target;
  }
  return class component extends target {
    [componentAppliedFlag] = true;
    @observable.ref
    props;
    constructor(props) {
      super(props);
      applyHandlerOnce(this, "stateRegister", props);
      applyHandlerOnce(this, "resourceRegister", props);
    }
    componentDidMount() {
      super.componentDidMount?.call(this);
      this[componentStatus] = "mounted";
    }
    componentWillUnmount() {
      super.componentWillUnmount?.call(this);
      applyHandlerOnce(this, "release");
    }
  };
};

// pure componentでは、propの変更があってもstateの変更がない限り、renderされない

const _pureComponent = target => {
  if (target.prototype[pureComponentAppliedFlag]) {
    return target;
  }
  return class component extends target {
    [pureComponentAppliedFlag] = true;
    shouldComponentUpdate(nextProps: any, nextState: any) {
      return nextState !== this.state;
    }
  };
};

export const component = combineDecorator(initializer, _component);

component.pure = combineDecorator(initializer, _component, _pureComponent);

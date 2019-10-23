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
      this[componentStatus] = "mounted";
    }
    componentWillUnmount() {
      applyHandlerOnce(this, "release");
    }
  };
};

const _pureComponent = target => {
  if (target.prototype[pureComponentAppliedFlag]) {
    return target;
  }
  return class component extends target {
    [pureComponentAppliedFlag] = true;
    shouldComponentUpdate(nextProps: any, nextState: any) {
      if (nextState !== this.state) {
        return nextState !== this.state;
      }
    }
  };
};

export const component = combineDecorator(initializer, _component);

component.pure = combineDecorator(initializer, _component, _pureComponent);

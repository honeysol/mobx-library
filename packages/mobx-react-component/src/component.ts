import { observable } from "mobx";
import {
  applyHandler,
  ClassType,
  combineClassDecorator,
} from "mobx-initializer";
import React from "react";
const componentAppliedFlag = Symbol("isAppliedMobxReactComponentInitializer");
const pureComponentAppliedFlag = Symbol(
  "isAppliedMobxReactPureComponentInitializer"
);

export const componentStatus = Symbol("componentStatus");

export type ReactComponentType = ClassType<React.Component>;

const _component = (target: ReactComponentType): ReactComponentType => {
  if (target.prototype[componentAppliedFlag]) {
    return target;
  }
  class Component extends target {
    [componentAppliedFlag] = true;
    [componentStatus]?: string;
    @observable.ref
    props: any;
    constructor(props: any) {
      super(props);
      applyHandler(this, "init", props);
      applyHandler(this, "stateRegister", props);
      applyHandler(this, "resourceRegister", props);
    }
    componentDidMount() {
      super.componentDidMount?.call(this);
      this[componentStatus] = "mounted";
    }
    componentWillUnmount() {
      super.componentWillUnmount?.call(this);
      applyHandler(this, "release");
    }
  }
  return Component;
};

// pure componentでは、propの変更があってもstateの変更がない限り、renderされない

const _pureComponent = (target: any) => {
  if (target.prototype[pureComponentAppliedFlag]) {
    return target;
  }
  return class Component extends target {
    [pureComponentAppliedFlag] = true;
    shouldComponentUpdate(nextProps: any, nextState: any) {
      return nextState !== this.state;
    }
  };
};

export const component = _component as ClassDecorator & {
  pure: ClassDecorator;
};

component.pure = combineClassDecorator(
  _component,
  _pureComponent
) as ClassDecorator;

import { observable } from "mobx";
import React from "react";
import { ClassType, combineClassDecorator } from "ts-decorator-manipulator";
const componentAppliedFlag = Symbol("isInitializedMobxReactComponent");
const pureComponentAppliedFlag = Symbol("isInitializedMobxReactPureComponent");

const applyHandler = (target: any, handlersName: string, ...args: any) => {
  const handlersKey = "_" + handlersName + "Handler";
  const flagPropetyName = handlersKey + "Done";
  if (target[flagPropetyName]) {
    return;
  }
  target[flagPropetyName] = true;
  for (
    let current = target;
    current;
    current = Object.getPrototypeOf(current)
  ) {
    if (Object.prototype.hasOwnProperty.call(current, handlersKey)) {
      for (const handler of current[handlersKey] || []) {
        handler.apply(target, args);
      }
    }
  }
};

export const addHandler = (target: any, handlersName: string, handler: any) => {
  const handlersKey = "_" + handlersName + "Handler";
  if (!Object.prototype.hasOwnProperty.call(target, handlersKey)) {
    target[handlersKey] = [];
  }
  target[handlersKey].push(handler);
};

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

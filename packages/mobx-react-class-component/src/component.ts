import { observable } from "mobx";
import React from "react";
import { ClassType, combineClassDecorator } from "ts-decorator-manipulator";
const componentAppliedFlag = Symbol("isAppliedMobxReactClassComponent");
const pureComponentAppliedFlag = Symbol("isAppliedMobxReactClassComponentPure");

const keyMap = new Map<string, symbol>();

const getKey = (name: string) => {
  if (!keyMap.has(name)) {
    keyMap.set(name, Symbol(name));
  }
  return keyMap.get(name) as symbol;
};

// targetはインスタンス
const applyHandler = (target: any, handlerName: string, ...args: any) => {
  const handlersKey = getKey(handlerName + "Handler");
  const appliedflagKey = getKey(handlerName + "HandlerApplied");
  if (target[appliedflagKey]) {
    return;
  }
  target[appliedflagKey] = true;
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

// targetは、classのprototype
const addHandler = (target: any, handlerName: string, handler: any) => {
  const handlersKey = getKey(handlerName + "Handler");
  if (!Object.prototype.hasOwnProperty.call(target, handlersKey)) {
    target[handlersKey] = [];
  }
  target[handlersKey].push(handler);
};

export const addInitializer = (target: any, handler: any) => {
  const cancelerKey = Symbol("canceler");
  addHandler(target, "init", function(this: any) {
    this[cancelerKey] = handler.apply(this);
  });
  addHandler(target, "release", function(this: any) {
    this[cancelerKey]?.();
  });
};

export const addTerminator = (target: any, handler: any) => {
  addHandler(target, "release", handler);
};

export const componentStatus = Symbol("componentStatus");

type ReactComponentType = ClassType<React.Component>;

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

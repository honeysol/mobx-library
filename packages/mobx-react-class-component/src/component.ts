import { createAtom, observable, runInAction } from "mobx";
import React from "react";
import {
  ClassDecorator,
  ClassType,
  combineClassDecorator,
} from "ts-decorator-manipulator";
const isBaseComponentKey = Symbol("isBaseComponentKey");

type ReactComponentType = ClassType<React.Component>;
type ObjectComponentType = ClassType<object>;

const keyMap = new Map<string, symbol>();

const getKey = (name: string) => {
  if (!keyMap.has(name)) {
    keyMap.set(name, Symbol(name));
  }
  return keyMap.get(name) as symbol;
};

// targetはインスタンス
const applyHandler = (
  target: any,
  prototype: any,
  key: symbol,
  handlerName: string,
  ...args: any
) => {
  const handlersKey = getKey(handlerName + "Handler");
  let shouldBeApplied = false;
  // console.log("start", target);
  for (
    let current = target;
    current;
    current = Object.getPrototypeOf(current)
  ) {
    // console.log(current, current === prototype, shouldBeApplied, target[key]);
    if (current === prototype) {
      shouldBeApplied = true;
    } else if (
      shouldBeApplied &&
      Object.prototype.hasOwnProperty.call(current, key)
    ) {
      break;
    }
    if (!shouldBeApplied) {
      continue;
    }
    // console.log("#");
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

const baseComponent = (target: ReactComponentType): ReactComponentType => {
  // if (target.prototype[isBaseComponentKey]) {
  //   return target;
  // }
  class BaseComponent extends target {
    [isBaseComponentKey]: boolean;
    [componentStatus]?: string;
    constructor(props: any) {
      super(props);
      applyHandler(
        this,
        BaseComponent.prototype,
        isBaseComponentKey,
        "init",
        props
      );
    }
    componentDidMount() {
      super.componentDidMount?.call(this);
      this[componentStatus] = "mounted";
    }
    componentWillUnmount() {
      super.componentWillUnmount?.call(this);
      applyHandler(
        this,
        BaseComponent.prototype,
        isBaseComponentKey,
        "release"
      );
    }
  }
  BaseComponent.prototype[isBaseComponentKey] = true;
  return BaseComponent;
};

// pure componentでは、propの変更があってもstateの変更がない限り、renderされない

const _pureComponent = (target: ReactComponentType): ReactComponentType => {
  class PureComponent extends target {
    constructor(props: any) {
      super(props);
    }
    shouldComponentUpdate(nextProps: any, nextState: any) {
      return nextState !== this.state;
    }
  }
  return PureComponent;
};

const copyProps = (dst: object, src: object) => {
  for (const key of Object.getOwnPropertyNames(dst)) {
    if (!Object.prototype.hasOwnProperty.call(src, key)) {
      delete (dst as any)[key];
    }
  }
  Object.assign(dst, src);
};

const _legacyComponent = (target: ReactComponentType): ReactComponentType => {
  class LegacyComponent extends target {
    constructor(props: any) {
      super(props);
    }
    @observable.ref
    props: any;
  }
  return LegacyComponent;
};

const _smartComponent = (target: ObjectComponentType): ObjectComponentType => {
  class SmartComponent extends target {
    constructor(props: any) {
      super(props);
    }
    @observable
    mobxProps: any;
    originalProps: any;
    propsAtom: any;
    state: any;
    set props(props: any) {
      this.originalProps = props;
      runInAction(() => {
        this.mobxProps = this.mobxProps || {};
        copyProps(this.mobxProps, props);
      });
    }
    get props() {
      this.propsAtom = this.propsAtom || createAtom("props");
      if (this.propsAtom.reportObserved()) {
        return this.mobxProps;
      } else {
        return this.originalProps;
      }
    }
    shouldComponentUpdate(nextProps: any, nextState: any) {
      return nextState !== this.state;
    }
  }
  return SmartComponent;
};

export const component = combineClassDecorator(
  baseComponent,
  _legacyComponent
) as ClassDecorator<any> & {
  pure: ClassDecorator<any>;
  smart: ClassDecorator<any>;
};

component.pure = combineClassDecorator(
  baseComponent,
  _pureComponent
) as ClassDecorator<any>;

component.smart = combineClassDecorator(
  baseComponent,
  _smartComponent as ClassDecorator<any>
) as ClassDecorator<any>;

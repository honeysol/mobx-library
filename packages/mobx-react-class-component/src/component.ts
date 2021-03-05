import React from "react";

import { GhostValue } from "./ghost";

const handlerAppliedMapKey = Symbol("handlerAppliedMap");

type ClassType<T> = any;
type ReactComponentType = ClassType<React.Component>;

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
  targetKey: any,
  specieKey: symbol,
  handlerName: string,
  ...args: any
) => {
  const handlersKey = getKey(handlerName + "Handler");
  let shouldBeApplied = false;
  for (
    let current = Object.getPrototypeOf(target);
    current;
    current = Object.getPrototypeOf(current)
  ) {
    if (!shouldBeApplied) {
      // 継承されている場合、subclassでのみ初期化を行う。
      if (!Object.prototype.hasOwnProperty.call(current, specieKey)) {
        continue;
      }
      if (!Object.prototype.hasOwnProperty.call(current, targetKey)) {
        break;
      }
      shouldBeApplied = true;
    }
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

const getHandlerAppliedMap = function(this: any) {
  if (!this[handlerAppliedMapKey]) {
    this[handlerAppliedMapKey] = new Set();
  }
  return this[handlerAppliedMapKey] as Set<string | symbol>;
};

export const addInitializer = (
  target: any,
  handler: any,
  propertyKey: string | symbol,
  trigger: "init" | "mounted" = "init"
) => {
  const cancelerKey = Symbol("canceler");

  addHandler(target, trigger, function(this: any) {
    const handlerAppliedMap = getHandlerAppliedMap.call(this);
    if (!handlerAppliedMap.has(propertyKey)) {
      handlerAppliedMap.add(propertyKey);
      this[cancelerKey] = handler.apply(this);
    }
  });
  addHandler(target, "release", function(this: any) {
    this[cancelerKey]?.();
  });
};

export const addTerminator = (target: any, handler: any) => {
  addHandler(target, "release", handler);
};

export const addUpdator = (
  target: any,
  handler: any,
  propertyKey: string | symbol
) => {
  addHandler(target, "update", function(this: any) {
    handler.apply(this);
  });
};

export const componentStatus = Symbol("componentStatus");

// Mixin two classes in the similar way with class inheritance
// dst: super class, src: sub class
// subclass may have "init" method instead of constructor
// This method is vulable for a change of MobX internal specification
// because it uses descrption field of Symbol("mobx pending decorators")
const mixinClass = <T, S>(
  dst: new (...args: any[]) => T,
  src: new (...args: any[]) => S
): new (...args: []) => T & S => {
  const constructor = function(this: T & S, ...args: any[]) {
    dst.apply(this, args);
    src.prototype.init?.apply(this, args);
    return this;
  };
  for (const propertyKey of [
    ...Object.getOwnPropertyNames(src.prototype),
    ...Object.getOwnPropertySymbols(src.prototype),
  ]) {
    const descriptor = Object.getOwnPropertyDescriptor(
      src.prototype,
      propertyKey
    );
    const dstDescriptor = Object.getOwnPropertyDescriptor(
      dst.prototype,
      propertyKey
    );
    if (descriptor?.value && dstDescriptor?.value) {
      if (
        typeof dst.prototype[propertyKey] === typeof src.prototype[propertyKey]
      ) {
        const type = dst.prototype[propertyKey];
        if (type === "function") {
          dst.prototype[propertyKey] = function(this: any, ...args: any[]) {
            dst.prototype[propertyKey].call(this, ...args);
            return src.prototype[propertyKey].call(this, ...args);
          };
          continue;
        } else if (type === "object") {
          dst.prototype[propertyKey] = {
            ...dst.prototype[propertyKey],
            ...src.prototype[propertyKey],
          };
          continue;
        }
      }
      dst.prototype[propertyKey] = src.prototype[propertyKey];
    } else if (propertyKey === "constructor") {
      continue;
    } else if (descriptor) {
      Object.defineProperty(dst.prototype, propertyKey, descriptor);
    }
  }
  constructor.prototype = dst.prototype;
  Object.defineProperty(constructor, "name", { value: dst.name });
  return constructor as any;
};

const isBaseComponentKey = Symbol("isBaseComponent");
const baseComponent = (target: ReactComponentType): ReactComponentType => {
  const isCurrentBaseComponentKey = Symbol("isCurrentBaseComponent");
  class BaseComponent extends React.Component {
    [isBaseComponentKey]: boolean;
    [isCurrentBaseComponentKey]: boolean;
    [componentStatus]?: string;
    init(props: any) {
      applyHandler(
        this,
        isCurrentBaseComponentKey,
        isBaseComponentKey,
        "init",
        props
      );
    }
    componentDidMount() {
      this[componentStatus] = "mounted";
      applyHandler(
        this,
        isCurrentBaseComponentKey,
        isBaseComponentKey,
        "mounted"
      );
      applyHandler(
        this,
        isCurrentBaseComponentKey,
        isBaseComponentKey,
        "update"
      );
    }
    componentDidUpdate(prevProps: any, prevState: any, snapshot: any) {
      applyHandler(
        this,
        isCurrentBaseComponentKey,
        isBaseComponentKey,
        "update"
      );
    }
    componentWillUnmount() {
      applyHandler(
        this,
        isCurrentBaseComponentKey,
        isBaseComponentKey,
        "release"
      );
    }
  }
  BaseComponent.prototype[isBaseComponentKey] = true;
  BaseComponent.prototype[isCurrentBaseComponentKey] = true;
  return mixinClass(target, BaseComponent);
};

export const component = (target: ReactComponentType): ReactComponentType => {
  class SmartComponent extends Object {
    propsAdmin?: GhostValue;
    propsAnnotation: any;
    nonIntrinsticRender?: boolean;
    currentChildren?: JSX.Element;
    nextChildren?: JSX.Element;
    state: any;
    initializeProps() {
      if (!this.propsAdmin) {
        this.propsAdmin = new GhostValue(this.propsAnnotation);
      }
    }
    set props(props: any) {
      this.initializeProps();
      this.propsAdmin!.value = props;
    }
    get props() {
      this.initializeProps();
      return this.propsAdmin!.value;
    }
    notifyRender(children: JSX.Element) {
      if (!this.nonIntrinsticRender) {
        console.log("intrinsic render");
        this.currentChildren = children;
      }
    }
    shouldComponentUpdate(nextProps: any, nextState: any) {
      const savedProps = this.props;
      const savedState = this.state;
      this.nonIntrinsticRender = true;
      this.state = nextState;
      this.props = nextProps;
      this.nextChildren = (this as any).render();
      const result = this.nextChildren !== this.currentChildren;
      this.nonIntrinsticRender = false;
      this.propsAdmin?.setTemporaryValue(savedProps);
      this.state = savedState;
      if (!result) {
        console.log("render skipped by shouldComponentUpdate");
      }
      return result;
    }
  }
  return mixinClass(baseComponent(target), SmartComponent);
};

component.pure = component;

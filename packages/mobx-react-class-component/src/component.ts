import { createAtom, observable, runInAction } from "mobx";
import React from "react";

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

export const addUpdator = (target: any, handler: any) => {
  const cancelerKey = Symbol("canceler");
  addHandler(target, "update", function(this: any) {
    this[cancelerKey]?.();
    this[cancelerKey] = handler.apply(this);
  });
  addHandler(target, "release", function(this: any) {
    this[cancelerKey]?.();
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
    if ((propertyKey as any).description === "mobx pending decorators") {
      dst.prototype[propertyKey] = {
        ...dst.prototype[propertyKey],
        ...src.prototype[propertyKey],
      };
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
      super.componentDidMount?.call(this);
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
      super.componentDidUpdate?.call(this, prevProps, prevState, snapshot);
      applyHandler(
        this,
        isCurrentBaseComponentKey,
        isBaseComponentKey,
        "update"
      );
    }
    componentWillUnmount() {
      super.componentWillUnmount?.call(this);
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

const copyProps = (dst: object, src: object) => {
  try {
    for (const key of Object.getOwnPropertyNames(dst)) {
      if (!Object.prototype.hasOwnProperty.call(src, key)) {
        delete (dst as any)[key];
      }
    }
    Object.assign(dst, src);
  } catch (e) {
    console.error(e);
  }
};

const smartComponent = (target: ReactComponentType): ReactComponentType => {
  class SmartComponent extends Object {
    @observable
    mobxProps: any;
    originalProps: any;
    propsAtom: any;
    calculatedOriginalProps: any;
    nonIntrinsticRender?: boolean;
    currentChildren?: JSX.Element;
    nextChildren?: JSX.Element;
    state: any;
    set props(props: any) {
      this.originalProps = props;
      this.updateMobxProps();
    }
    get props() {
      this.propsAtom = this.propsAtom || createAtom("props");
      if (this.propsAtom.reportObserved()) {
        if (this.calculatedOriginalProps !== this.originalProps) {
          console.error(
            "Incompatible props. React might change props after shouldComponentUpdate. This error happens because of consistency between React and this library.",
            this.calculatedOriginalProps,
            this.originalProps
          );
        }
        const result = this.mobxProps;
        return result;
      } else {
        return this.originalProps;
      }
    }
    updateMobxProps() {
      if (this.calculatedOriginalProps !== this.originalProps) {
        this.calculatedOriginalProps = this.originalProps;
        runInAction(() => {
          if (!this.mobxProps) {
            this.mobxProps = {};
          }
          copyProps(this.mobxProps, this.originalProps);
        });
      }
      return this.mobxProps;
    }
    notifyRender(children: JSX.Element) {
      if (!this.nonIntrinsticRender) {
        console.log("intrinsic render");
        this.currentChildren = children;
      }
    }
    shouldComponentUpdate(nextProps: any, nextState: any) {
      const savedProps = this.originalProps;
      const savedState = this.state;
      this.nonIntrinsticRender = true;
      this.state = nextState;
      this.originalProps = nextProps;
      this.updateMobxProps();
      this.nextChildren = (this as any).render();
      const result = this.nextChildren !== this.currentChildren;
      this.nonIntrinsticRender = false;
      this.originalProps = savedProps;
      this.state = savedState;
      if (!result) {
        console.log("render skipped by shouldComponentUpdate");
      }
      return result;
    }
  }
  return mixinClass(baseComponent(target), SmartComponent);
};

// pure componentでは、propの変更があってもstateの変更がない限り、renderされない
const pureComponent = (target: ReactComponentType): ReactComponentType => {
  class PureComponent extends React.Component {
    constructor(props: any) {
      super(props);
    }
    shouldComponentUpdate(nextProps: any, nextState: any) {
      return nextState !== this.state;
    }
  }
  return mixinClass(baseComponent(target), PureComponent);
};

export const component = (target: ReactComponentType): ReactComponentType => {
  class LegacyComponent extends React.Component {
    constructor(props: any) {
      super(props);
    }
    @observable.ref
    props: any;
  }
  return mixinClass(baseComponent(target), LegacyComponent);
};

component.pure = pureComponent;

component.smart = smartComponent;

import { makeObservable } from "mobx";
import React from "react";

import { GhostValue } from "./ghost";
import { applyHandler } from "./utils/handler";
import { mixinClass } from "./utils/mixin";
import { getStoredAnnotation } from "./utils/mobx";

export { addInitializer, addTerminator, addUpdator } from "./utils/handler";
export const componentStatus = Symbol("componentStatus");

type ClassType<T> = any;
type ReactComponentType = ClassType<React.Component>;

const isBaseComponentKey = Symbol("isBaseComponent");
const baseComponent = (target: ReactComponentType): ReactComponentType => {
  const isCurrentBaseComponentKey = Symbol("isCurrentBaseComponent");
  class BaseComponent extends React.Component {
    [isBaseComponentKey]: boolean;
    [isCurrentBaseComponentKey]: boolean;
    [componentStatus]?: string;
    init(props: any) {
      if (typeof makeObservable === "function") {
        makeObservable(this);
      }
      const storedAnnotation = getStoredAnnotation.call(this);
      if (storedAnnotation && Object.keys(storedAnnotation).length > 0) {
        console.error("makeObservable failed ", storedAnnotation);
      }
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
    propsAnnotations: any;
    stateAdmin?: GhostValue;
    nonIntrinsticRender?: boolean;
    currentChildren?: JSX.Element;
    initializeProps() {
      if (!this.propsAdmin) {
        this.propsAdmin = new GhostValue(this.propsAnnotations);
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
    initializeState() {
      if (!this.stateAdmin) {
        this.stateAdmin = new GhostValue();
      }
    }
    set state(state: any) {
      this.initializeState();
      this.stateAdmin!.value = state;
    }
    get state() {
      this.initializeState();
      return this.stateAdmin!.value;
    }
    notifyRender(children: JSX.Element) {
      if (!this.nonIntrinsticRender) {
        console.log("intrinsic render");
        this.currentChildren = children;
      }
    }
    shouldComponentUpdate(nextProps: any, nextState: any) {
      console.log(
        "shouldComponentUpdate start",
        this.props !== nextProps,
        this.state !== nextState
      );
      const savedProps = this.props;
      const savedState = this.state;
      this.nonIntrinsticRender = true;
      this.state = nextState;
      this.props = nextProps;
      const result = (this as any).render() !== this.currentChildren;
      this.nonIntrinsticRender = false;
      this.propsAdmin?.setTemporaryValue(savedProps);
      this.stateAdmin?.setTemporaryValue(savedState);
      if (!result) {
        console.log("shouldComponentUpdate skip render");
      } else {
        console.log("shouldComponentUpdate accept render");
      }
      return result;
    }
  }
  return mixinClass(baseComponent(target), SmartComponent);
};

component.pure = component;

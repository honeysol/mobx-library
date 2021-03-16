import React from "react";

import { GhostValue } from "./ghost";
import { logger } from "./logger";
import { applyHandler } from "./utils/handler";
import { getStoredAnnotation } from "./utils/mobx";

export { addInitializer, addTerminator, addUpdator } from "./utils/handler";
export const componentStatus = Symbol("componentStatus");

// enabled in MobX6 only
const { makeObservable } = require("mobx");

type ClassType<T> = any;
type ReactComponentType = ClassType<React.Component>;

const isBaseComponentKey = Symbol("isBaseComponent");
export const component = (target: ReactComponentType): ReactComponentType => {
  const isCurrentBaseComponentKey = Symbol("isCurrentBaseComponent");
  class BaseComponent extends target {
    [isBaseComponentKey]: boolean;
    [isCurrentBaseComponentKey]: boolean;
    [componentStatus]?: string;
    constructor(props: any) {
      super(props);
      if (typeof makeObservable === "function") {
        makeObservable(this);
      }
      const storedAnnotation = getStoredAnnotation.call(this);
      if (storedAnnotation && Object.keys(storedAnnotation).length > 0) {
        console.error("makeObservable failed ", storedAnnotation);
      }
      const savedProps = this.props;
      this.props = props;
      applyHandler(
        this,
        isCurrentBaseComponentKey,
        isBaseComponentKey,
        "init",
        props
      );
      this.propsAdmin?.setTemporaryValue(savedProps);
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
    propsAdmin?: GhostValue;
    propsAnnotations: any;
    stateAdmin?: GhostValue;
    nonIntrinsticRender?: boolean;
    currentChildren?: JSX.Element;
    getPropsAdmin() {
      if (!this.propsAdmin) {
        this.propsAdmin = new GhostValue(this.propsAnnotations);
      }
      return this.propsAdmin;
    }
    set props(props: any) {
      this.getPropsAdmin().value = props;
    }
    get props() {
      return this.getPropsAdmin().value;
    }
    getStateAdmin() {
      if (!this.stateAdmin) {
        this.stateAdmin = new GhostValue();
      }
      return this.stateAdmin;
    }
    set state(state: any) {
      this.getStateAdmin().value = state;
    }
    get state() {
      return this.getStateAdmin().value;
    }
    notifyRender(children: JSX.Element) {
      if (!this.nonIntrinsticRender) {
        logger.log("intrinsic render", children);
        this.currentChildren = children;
      }
    }
    shouldComponentUpdate(nextProps: any, nextState: any) {
      logger.log(
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
        logger.log("shouldComponentUpdate skip render");
      } else {
        logger.log("shouldComponentUpdate accept render");
      }
      return result;
    }
  }
  BaseComponent.prototype[isBaseComponentKey] = true;
  BaseComponent.prototype[isCurrentBaseComponentKey] = true;
  return BaseComponent;
};

component.pure = component;

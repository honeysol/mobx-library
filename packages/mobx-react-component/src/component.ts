import { observable } from "mobx";
import {
  initializer,
  applyHandlerOnce,
  combineDecorator,
} from "mobx-initializer";

const componentAppliedFlag = Symbol("isAppliedMobxReactComponentInitializer");
const pureComponentAppliedFlag = Symbol(
  "isAppliedMobxReactPureComponentInitializer"
);

export const componentStatus = Symbol("componentStatus");

interface MobXComponent extends React.Component {
  componentStatus?: "mounted";
}

const _component = (target: new (...args: any[]) => MobXComponent) => {
  if (target.prototype[componentAppliedFlag]) {
    return target;
  }
  class Component extends target {
    [componentAppliedFlag] = true;
    [componentStatus]?: string;
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
  }
  return Component;
};

// pure componentでは、propの変更があってもstateの変更がない限り、renderされない

const _pureComponent = target => {
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

export const component: any = combineDecorator(initializer, _component);

component.pure = combineDecorator(initializer, _component, _pureComponent);

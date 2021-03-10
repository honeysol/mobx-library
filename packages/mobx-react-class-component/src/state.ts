import { computed } from "mobx";
import {
  combineMethodDecorator,
  MethodDecoratorOptionalGenerator,
  parametrizeMethodDecorator,
} from "ts-decorator-manipulator";
import { evacuate } from "ts-decorator-manipulator";

import { componentStatus } from "./component";
import { watch, WatchOption } from "./watch";

interface StateOption extends WatchOption {
  annotation?: any;
  canceler?: (value: any) => boolean;
}

const _stateWithOption = (options?: StateOption) => (
  target: object,
  propertyKey: string | symbol,
  descriptor?: PropertyDescriptor
) => {
  if (options?.annotation) {
    (target as any).stateAnnotation = (target as any).stateAnnotation = {};
    (target as any).stateAnnotation[propertyKey] = options.annotation;
  }
  return watch(
    function(this: any) {
      if (options?.canceler?.call(this, this[propertyKey])) {
        return;
      }
      if (this[componentStatus] === "mounted") {
        this.setState({ [propertyKey]: this[propertyKey] });
      } else {
        this.state = this.state || {};
        this.state[propertyKey] = this[propertyKey];
      }
    },
    { delay: 10, ...options }
  )(target, propertyKey, descriptor);
};

const _state = parametrizeMethodDecorator(
  _stateWithOption,
  () => undefined as StateOption | undefined
);

const generateStateDecorator = (decorator: PropertyDecorator) => {
  return parametrizeMethodDecorator(
    (options?: StateOption) =>
      combineMethodDecorator(
        evacuate(decorator, "original"),
        _stateWithOption(options)
      ),
    () => undefined as StateOption | undefined
  );
};

export const state = _state as typeof _state & {
  computed: MethodDecoratorOptionalGenerator<StateOption | undefined> & {
    struct: MethodDecoratorOptionalGenerator<StateOption | undefined>;
  };
};

state.computed = generateStateDecorator(
  computed
) as MethodDecoratorOptionalGenerator<StateOption | undefined> & {
  struct: MethodDecoratorOptionalGenerator<StateOption | undefined>;
};
state.computed.struct = generateStateDecorator(computed.struct);

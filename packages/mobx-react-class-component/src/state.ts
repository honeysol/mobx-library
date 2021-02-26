import { computed } from "mobx";
import {
  combineMethodDecorator,
  MethodDecoratorOptionalGenerator,
  parametrizeMethodDecorator,
} from "ts-decorator-manipulator";

import { componentStatus } from "./component";
import { watch, WatchOption } from "./watch";

const _stateWithOption = (options?: WatchOption) => (
  target: object,
  propertyKey: string | symbol,
  descriptor?: PropertyDescriptor
) => {
  return watch(
    function(this: any) {
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
  () => undefined as WatchOption | undefined
);

const generateStateDecorator = (decorator: PropertyDecorator) => {
  return parametrizeMethodDecorator(
    (options?: WatchOption) =>
      combineMethodDecorator(decorator, _stateWithOption(options)),
    () => undefined as WatchOption | undefined
  );
};

export const state = _state as typeof _state & {
  computed: MethodDecoratorOptionalGenerator<WatchOption | undefined> & {
    struct: MethodDecoratorOptionalGenerator<WatchOption | undefined>;
  };
};

state.computed = generateStateDecorator(
  computed
) as MethodDecoratorOptionalGenerator<WatchOption | undefined> & {
  struct: MethodDecoratorOptionalGenerator<WatchOption | undefined>;
};
state.computed.struct = generateStateDecorator(computed.struct);

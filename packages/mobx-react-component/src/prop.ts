import { computed } from "mobx";
import {
  parametrizePropertyDecorator,
  PropertyDecoratorOptionalGenerator,
} from "mobx-initializer";

import { intercept } from "./intercept";

// example:
// fieldIdentifierToFunc("foo.bar")({ foo: { bar: 123} }) === 123
const fieldIdentifierToFunc = (fieldIdentifier: string) => {
  const exp = fieldIdentifier
    .split(".")
    .map(field => `(a=a[${JSON.stringify(field)}])`)
    .join("&&");
  return eval(`(function(a){return ${exp};})`);
};

const createPropDecorator = (baseDecorator: MethodDecorator) => {
  return parametrizePropertyDecorator(
    (propName: string) => (target, fieldName) => {
      const getter = fieldIdentifierToFunc(propName);
      baseDecorator(target, fieldName, {
        get: function(this: any) {
          return getter(this.props);
        },
      });
    },
    (_target: unknown, fieldName: string) => fieldName
  );
};
export const prop = createPropDecorator(
  computed
) as PropertyDecoratorOptionalGenerator<string> & {
  deep: PropertyDecoratorOptionalGenerator<string>;
  delegate: PropertyDecoratorOptionalGenerator<string>;
};

prop.deep = createPropDecorator(intercept.isEqual);

prop.delegate = parametrizePropertyDecorator(
  (propName: string) => (target: object, fieldName: string | symbol) => {
    return {
      get(this: any) {
        return (...args: any) => {
          this.props[propName](...args);
        };
      },
    } as PropertyDescriptor;
  },
  (_target: unknown, fieldName: string) => fieldName
);

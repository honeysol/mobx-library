import { observable } from "mobx";
import {
  parametrizePropertyDecorator,
  PropertyDecoratorOptionalGenerator,
} from "ts-decorator-manipulator";

// example:
// fieldIdentifierToFunc("foo.bar")({ foo: { bar: 123} }) === 123
const fieldIdentifierToFunc = (fieldIdentifier: string) => {
  const exp = fieldIdentifier
    .split(".")
    .map(field => `(a=a[${JSON.stringify(field)}])`)
    .join("&&");
  return eval(`(function(a){return ${exp};})`);
};

const createPropDecorator = (baseDecorator?: any) => {
  return parametrizePropertyDecorator(
    (propName: string) => (target: any, propertyKey) => {
      const propKey = propName || (propertyKey as string);
      if (baseDecorator || baseDecorator === false) {
        target.annotations = target.annotations || {};
        target.annotations[propKey] = baseDecorator;
      }
      const getter = fieldIdentifierToFunc(propKey);
      return {
        get: function(this: any) {
          return getter(this.props);
        },
      };
    },
    (_target: unknown, propertyKey: string | symbol) => propertyKey as string
  );
};
export const prop = createPropDecorator() as PropertyDecoratorOptionalGenerator<
  string
> & {
  deep: PropertyDecoratorOptionalGenerator<string>;
  struct: PropertyDecoratorOptionalGenerator<string>;
  static: PropertyDecoratorOptionalGenerator<string>;
};

prop.struct = prop.deep = createPropDecorator(observable.struct);
prop.static = createPropDecorator(false);

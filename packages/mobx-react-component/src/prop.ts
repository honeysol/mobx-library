import { computed } from "mobx";
import {
  parametrizePropertyDecorator,
  PropertyDecoratorOptionalGenerator,
} from "mobx-initializer";

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
      return baseDecorator(target, fieldName, {
        get: function(this: any) {
          return getter(this.props);
        },
      });
    },
    (_target: unknown, fieldName: string | symbol) => fieldName as string
  );
};
export const prop = createPropDecorator(
  computed
) as PropertyDecoratorOptionalGenerator<string> & {
  deep: PropertyDecoratorOptionalGenerator<string>;
  delegate: PropertyDecoratorOptionalGenerator<string>;
};

prop.deep = createPropDecorator(computed.struct);

// 値ではなく、props中の関数の結果を評価する
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
  (_target: unknown, fieldName: string | symbol) => fieldName as string
);

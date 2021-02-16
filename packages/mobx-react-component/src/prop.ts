import { computed } from "mobx";
import { parametrizeDecorator } from "mobx-initializer";
import { intercept } from "./intercept";

// example:
// fieldIdentifierToFunc("foo.bar")({ foo: { bar: 123} }) === 123
const fieldIdentifierToFunc = fieldIdentifier => {
  const exp = fieldIdentifier
    .split(".")
    .map(field => `(a=a[${JSON.stringify(field)}])`)
    .join("&&");
  return eval(`(function(a){return ${exp};})`);
};

const createPropDecorator = computedFunc =>
  parametrizeDecorator(
    propName => (target, fieldName, descriptor) => {
      const getter = fieldIdentifierToFunc(propName);
      return computedFunc(target, fieldName, {
        get: function() {
          return getter(this.props);
        },
      });
    },
    (target, fieldName) => fieldName
  );

export const prop:any = createPropDecorator(computed);

prop.deep = createPropDecorator(intercept.isEqual);

const propDelegateDecorator = parametrizeDecorator(
  propName => (target, fieldName, descriptor) => {
    return {
      get() {
        return (...args) => {
          this.props[propName](...args);
        };
      },
    };
  },
  (target, fieldName) => fieldName
);

prop.delegate = propDelegateDecorator;

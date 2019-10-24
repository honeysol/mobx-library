import { computed } from "mobx";
import { parametrizeDecorator } from "../mobx-initializer/util";
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

export const prop = createPropDecorator(computed);

prop.deep = createPropDecorator(intercept.isEqual);

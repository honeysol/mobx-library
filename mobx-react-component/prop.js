import { computed } from "mobx";
import { parametrizeDecorator } from "../mobx-initializer/util";

// example:
// fieldIdentifierToFunc("foo.bar")({ foo: { bar: 123} }) === 123
const fieldIdentifierToFunc = fieldIdentifier => {
  const exp = fieldIdentifier
    .split(".")
    .map(field => `(a=a[${JSON.stringify(field)}])`)
    .join("&&");
  return eval(`(function(a){return ${exp};})`);
};

const _prop = parametrizeDecorator(
  propName => (target, fieldName, descriptor) => {
    const getter = fieldIdentifierToFunc(propName);
    return computed(target, fieldName, {
      ...descriptor,
      value: null,
      get: function() {
        return getter(this.props);
      },
    });
  },
  (target, fieldName) => fieldName
);

export const prop = _prop;

import { runInAction, observable } from "mobx";
import {
  addHandler,
  combineDecorator,
  acceptParams,
  parametrizeDecorator,
} from "../mobx-initializer/util";

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
  (propName, intercepter) => (target, fieldName, descriptor) => {
    const getter = fieldIdentifierToFunc(propName);
    addHandler(target, "propUpdate", function(props) {
      const newValue = getter(props),
        oldValue = this[fieldName];
      if (intercepter && !intercepter({ newValue, oldValue })) {
        return;
      }
      runInAction(() => {
        this[fieldName] = getter(props);
      });
    });
  },
  (target, fieldName) => fieldName
);

export const prop = combineDecorator(acceptParams(_prop), observable.ref);

prop.deep = combineDecorator(acceptParams(_prop), observable.deep);
prop.shallow = combineDecorator(acceptParams(_prop), observable.shallow);
prop.ref = combineDecorator(acceptParams(_prop), observable.ref);
prop.struct = combineDecorator(acceptParams(_prop), observable.struct);

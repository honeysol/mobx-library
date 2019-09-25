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
  propName => (target, fieldName, descriptor) => {
    const getter = fieldIdentifierToFunc(propName);
    addHandler(target, "propUpdate", function(props) {
      runInAction(() => {
        this[fieldName] = getter(props);
      });
    });
  },
  (target, fieldName) => fieldName
);

export const prop = combineDecorator(acceptParams(_prop), observable);

prop.observable = combineDecorator(acceptParams(_prop), observable);
prop.observable.deep = combineDecorator(acceptParams(_prop), observable.deep);
prop.observable.shallow = combineDecorator(
  acceptParams(_prop),
  observable.shallow
);
prop.observable.ref = combineDecorator(acceptParams(_prop), observable.ref);
prop.observable.struct = combineDecorator(
  acceptParams(_prop),
  observable.struct
);

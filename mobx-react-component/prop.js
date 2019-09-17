import { runInAction, observable } from "mobx";
import { addHandler, combineDecorator } from "../mobx-initializer/util";

const _prop = (target, fieldName, descriptor) => {
  addHandler(target, "propUpdate", function(props) {
    console.log("propUpdate", fieldName);
    runInAction(() => {
      this[fieldName] = props[fieldName];
    });
  });
};

export const prop = combineDecorator(_prop, observable);

prop.deep = combineDecorator(_prop, observable.deep);
prop.shallow = combineDecorator(_prop, observable.shallow);
prop.ref = combineDecorator(_prop, observable.ref);
prop.struct = combineDecorator(_prop, observable.struct);

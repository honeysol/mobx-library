import { autorun as mobxAutorun } from "mobx";

import { addInitializer } from "./component";

export const autorun = (
  target: object,
  propertyKey: string | symbol,
  descriptor: any
) => {
  addInitializer(
    target,
    function(this: any) {
      return mobxAutorun(this[propertyKey].bind(this));
    },
    propertyKey
  );
};

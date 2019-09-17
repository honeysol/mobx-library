import { observe } from "mobx";
import { addHandler } from "../mobx-initializer/util";

export const resource = ({ on, off, handler, resourceFieldName }) => (
  target,
  fieldName,
  descriptor
) => {
  const wrappedHandlerFieldName = "_" + fieldName + "Handler";

  addHandler(this, "init", () => {
    this[wrappedHandlerFieldName] = event => {
      this[fieldName] = (handler || (value => value))(event);
    };
    observe(
      this,
      resourceFieldName,
      ({ oldResource, newResource }) => {
        if (oldResource) {
          off(oldResource, this[wrappedHandlerFieldName]);
        }
        if (newResource) {
          on(oldResource, this[wrappedHandlerFieldName]);
        }
      },
      true
    );
  });
  addHandler(this, "release", () => {
    off(this[resourceFieldName], this[wrappedHandlerFieldName]);
  });
};

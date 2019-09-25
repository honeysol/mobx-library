import { observe } from "mobx";
import { addHandler } from "../mobx-initializer/util";
const capitalize = s => s[0].toUpperCase() + s.slice(1);

export const resource = _handlerName => (target, fieldName, descriptor) => {
  const handlerName = _handlerName || "onUpdate" + capitalize(fieldName);
  if (!target[handlerName]) {
    console.error(`Handler "${handlerName}" not found for `, target);
    return;
  }
  addHandler(target, "init", () => {
    observe(
      this,
      fieldName,
      ({ oldValue, newValue }) => {
        if (oldValue) {
          oldValue.off("update", this[handlerName]);
        }
        if (newValue) {
          newValue.on("update", this[handlerName]);
        }
      },
      true
    );
  });
  addHandler(target, "init", () => {
    this[fieldName].off("update", this[handlerName]);
  });
};

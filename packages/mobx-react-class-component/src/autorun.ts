import { autorun as mobxAutorun } from "mobx";

import { addInitializer } from "./component";

function autorunWithCleanUp(fn: () => () => void, options?: any) {
  let cleanupFn: (() => void) | null = null;
  const canceler = mobxAutorun(() => {
    cleanupFn?.();
    cleanupFn = fn();
  }, options);
  return () => {
    canceler();
    cleanupFn?.();
  };
}

export const autorun = (
  target: object,
  propertyKey: string | symbol,
  descriptor: any
) => {
  addInitializer(
    target,
    function(this: any) {
      return autorunWithCleanUp(this[propertyKey].bind(this));
    },
    propertyKey
  );
};

import { IReactionDisposer, reaction } from "mobx";
import { assert } from "mobx-annotation-manipulator";

import { IMonitorRetained, monitorRetained } from "./monitorRetained";
const none = Symbol("none");

// monitor change of `get` with keeping value observed during retentionTime
export const monitorChange = <T>({
  get,
  enter,
  leave,
  change,
  retentionTime,
  name,
  allowUntracked,
}: {
  get: () => T;
  enter: () => void;
  leave: (value: T) => void;
  change: (value: T, oldValue: T) => void;
  retentionTime?: number;
  name?: string;
  allowUntracked?: boolean;
}): IMonitorRetained<T> => {
  const getWithTrap = () => {
    const value = get();
    if (oldValue !== none) {
      if (oldValue !== value) change(value, oldValue);
    }
    oldValue = value;
    return value;
  };
  let retainer: IReactionDisposer | undefined = undefined;
  let oldValue: T | typeof none = none;
  return monitorRetained({
    enter() {
      assert(retainer, "internal error");
      if (typeof retentionTime === "number") {
        retainer = reaction(
          () => getWithTrap(),
          () => {}
        );
      }
    },
    leave() {
      assert(oldValue !== none, "internal error");
      leave(oldValue);
      oldValue = none;
      retainer?.();
    },
    get: getWithTrap,
    retentionTime,
    name,
    allowUntracked,
  });
};

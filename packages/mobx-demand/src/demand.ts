import { assert } from "mobx-annotation-manipulator";
import { IMonitorRetained, monitorRetained } from "mobx-monitor";
const none = Symbol("none");

// generate value on demand, cleanup when it will become unused.
export const demand = <T>({
  get,
  cleanup,
  retentionTime,
  name,
  allowUntracked,
}: {
  cleanup?: (value: T) => void;
  retentionTime?: number;
  name?: string;
  get: () => T;
  allowUntracked?: boolean;
}): IMonitorRetained<T> => {
  let value: T | typeof none = none;
  return monitorRetained({
    enter() {
      assert(value === none, "internal error");
      value = get();
    },
    leave() {
      assert(value !== none, "internal error");
      value && cleanup?.(value);
      value = none;
    },
    get() {
      assert(value !== none, "internal error");
      return value;
    },
    retentionTime,
    name,
    allowUntracked,
  });
};

import { createAtom } from "mobx";
import { assert } from "mobx-annotation-manipulator";

// Proxy getter and monitorRetained enter/leave event with optional retensionTime
export interface IMonitor<T> {
  get: () => T;
}

export const monitor = <T>({
  enter,
  leave,
  get,
  name,
  allowUntracked,
}: {
  enter: () => void;
  leave: () => void;
  get: () => T;
  name?: string;
  allowUntracked?: boolean;
}): IMonitor<T> => {
  let observed = false;
  const _enter = () => {
    enter();
    observed = true;
  };
  const _leave = () => {
    observed = false;
    leave();
  };
  const atom = createAtom(
    name || "observeRetain",
    () => {
      _enter();
    },
    () => {
      _leave();
    }
  );
  return {
    get() {
      atom.reportObserved();
      if (!observed) {
        assert(allowUntracked, "untracked access not allowd");
        // untracked access while not observed
        _enter();
        const value = get();
        _leave();
        return value;
      } else {
        return get();
      }
    },
  };
};

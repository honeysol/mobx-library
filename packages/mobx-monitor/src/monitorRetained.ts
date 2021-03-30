import { createAtom } from "mobx";
import { assert } from "mobx-annotation-manipulator";

import { IMonitor } from "./monitor";

export interface IMonitorRetained<T> extends IMonitor<T> {
  get: () => T;
  invalidate: () => void;
}

export const monitorRetained = <T>({
  enter,
  leave,
  get,
  retentionTime,
  name,
  allowUntracked,
}: {
  enter: () => void;
  leave: () => void;
  get: () => T;
  retentionTime?: number;
  name?: string;
  allowUntracked?: boolean;
}): IMonitorRetained<T> => {
  let cancelTimer: NodeJS.Timeout | undefined = undefined;
  let observed = false;
  let entered = false; // if observed, entered should be true (assert(!observed || entered))
  const _enter = () => {
    if (!entered) {
      entered = true;
      enter();
    }
  };
  const _leave = () => {
    assert(entered, "internal error");
    entered = false;
    leave();
  };
  const startCleanUpTimer = () => {
    if (typeof retentionTime === "number") {
      stopCleanUpTimer();
      cancelTimer = setTimeout(() => {
        cancelTimer = undefined;
        _leave();
      }, retentionTime);
    } else {
      _leave();
    }
  };
  const stopCleanUpTimer = () => {
    if (cancelTimer) {
      clearTimeout(cancelTimer);
      cancelTimer = undefined;
    }
  };
  const atom = createAtom(
    name || "observeRetain",
    () => {
      observed = true;
      _enter();
      stopCleanUpTimer();
    },
    () => {
      observed = false;
      startCleanUpTimer();
    }
  );
  return {
    get() {
      atom.reportObserved();
      if (!observed) {
        // untracked access while not observed
        assert(allowUntracked, "untracked access not allowd");
        _enter();
        const value = get();
        startCleanUpTimer();
        return value;
      } else {
        assert(entered, "internal error");
        assert(!cancelTimer, "internal error");
        return get();
      }
    },
    invalidate() {
      if (!observed && entered) {
        stopCleanUpTimer();
        _leave();
      }
    },
  };
};

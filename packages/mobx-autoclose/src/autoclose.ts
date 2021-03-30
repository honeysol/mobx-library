import {
  assert,
  createSymmetricAnnotation,
  ExtendedSymmetricAnnotation,
  PropertyAccessor,
} from "mobx-annotation-manipulator";
import { IMonitorRetained, monitorComputed } from "mobx-monitor";

const _autoclose = <T>({
  get,
  cleanup,
  retentionTime,
  name,
  allowUntracked,
}: {
  cleanup: (value: T) => void;
  retentionTime?: number;
  name?: string;
  get: () => T;
  allowUntracked?: boolean;
}): IMonitorRetained<T> => {
  return monitorComputed({
    enter() {},
    change(_value, oldValue) {
      cleanup(oldValue);
    },
    leave(oldValue) {
      cleanup(oldValue);
    },
    get,
    retentionTime,
    name,
    allowUntracked,
  });
};

export const autoclose = <TT>({
  cleanup,
  retentionTime,
  name,
}: {
  cleanup: (value: TT) => void;
  retentionTime?: number;
  name?: string;
}): ExtendedSymmetricAnnotation<TT> => {
  return createSymmetricAnnotation<TT>(
    <T extends TT>(accessor?: PropertyAccessor<T>) => {
      assert(accessor?.get, "accessor doesn't have get property", accessor);
      return _autoclose<T>({
        cleanup,
        retentionTime,
        name,
        get: accessor.get,
      });
    },
    {
      annotationType: "demand",
    }
  );
};

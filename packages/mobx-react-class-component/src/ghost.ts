import { createAtom, extendObservable, observable, runInAction } from "mobx";

// MobXのcontextで読み出すと、リアクティブに変換されたオブジェクトを
// untracked contextだと、オリジナルのオブジェクトを返す

const copyValue = function(dst: any, src: any, annotations: any) {
  try {
    for (const key of Object.getOwnPropertyNames(dst)) {
      if (!Object.prototype.hasOwnProperty.call(src, key)) {
        dst[key] = undefined;
      }
    }
    const extendObj = {} as Record<string, any>;
    const directExtendObj = {} as Record<string, any>;
    const annotationObj = {} as Record<string, any>;
    for (const key of Object.getOwnPropertyNames(src)) {
      if (!Object.prototype.hasOwnProperty.call(dst, key)) {
        const annotation = annotations?.[key];
        if (annotation !== false) {
          extendObj[key] = src[key];
          annotationObj[key] = annotation || observable.ref;
        } else {
          directExtendObj[key] = src[key];
        }
      } else {
        if (dst[key] !== src[key]) {
          dst[key] = src[key];
        }
      }
    }
    extendObservable(dst, extendObj, annotationObj);
    Object.assign(dst, directExtendObj);
  } catch (e) {
    console.error(e);
  }
};

export class GhostValue {
  mobxValue: any;
  originalValue: any;
  atom: any;
  annotations: any;
  calculatedOriginalValue: any;
  constructor(annotations: any = {}) {
    this.annotations = annotations;
  }
  setTemporaryValue(value: any) {
    this.originalValue = value;
  }
  set value(value: any) {
    this.originalValue = value;
    if (this.calculatedOriginalValue !== this.originalValue) {
      this.calculatedOriginalValue = this.originalValue;
      runInAction(() => {
        if (!this.mobxValue) {
          this.mobxValue = {};
        }
        copyValue(this.mobxValue, this.originalValue, this.annotations);
      });
    }
  }
  get value() {
    this.atom = this.atom || createAtom("ghost");
    if (this.atom.reportObserved()) {
      if (this.calculatedOriginalValue !== this.originalValue) {
        console.error(
          "Internal incompatibility. React didn't update props or state adequately before shouldComponentUpdate.",
          this.calculatedOriginalValue,
          this.originalValue
        );
      }
      const result = this.mobxValue;
      return result;
    } else {
      return this.originalValue;
    }
  }
}

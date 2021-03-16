import type {
  Annotation,
  ObservableObjectAdministration,
} from "mobx/dist/internal.d";

import { storedAnnotationKey } from "./symbol";

export const storedAnnotationEnabled = !!storedAnnotationKey;

export const storeAnnotation = function (
  this: any,
  key: PropertyKey,
  annotation: Annotation
): void {
  if (!storedAnnotationKey) {
    return;
  }
  if (!this[storedAnnotationKey]) {
    this[storedAnnotationKey] = {};
  }
  this[storedAnnotationKey][key] = annotation;
};

export const recordAnnotationApplied = (
  adm: ObservableObjectAdministration,
  annotation: Annotation,
  key: PropertyKey
): void => {
  if (!storedAnnotationKey) {
    return;
  }
  if (__DEV__) {
    (adm.appliedAnnotations_ as any)[key] = annotation;
  }
  delete adm.target_[storedAnnotationKey]?.[key];
};

import type firebase from "firebase";
import type { IObservableArray } from "mobx";
import { assert } from "mobx-annotation-manipulator";

import type { downConverter } from "./CoreDocument";

type QuerySnapshot = firebase.firestore.QuerySnapshot<firebase.firestore.DocumentData>;

export const reflectChange = <R>(
  snapshot: QuerySnapshot,
  items: IObservableArray<R | undefined>,
  map: Map<string, R>,
  downConverter: downConverter<R>
): void => {
  if (items.length === 0) {
    assert(map.size === 0, "internal error");
    items.replace(
      snapshot.docs.map((doc) => {
        const item = downConverter(doc);
        map.set(doc.id, item);
        return item;
      })
    );
  } else {
    const docChanges = snapshot.docChanges();
    for (const change of docChanges) {
      const doc = change.doc;
      if (change.type == "added") {
        if (__DEV__) assert(!map.has(doc.id), "internal error");
        map.set(doc.id, downConverter(doc));
      } else if (change.type == "removed") {
        if (__DEV__) assert(!map.has(doc.id), "internal error");
        map.delete(doc.id);
      } else if (change.type == "modified") {
        if (__DEV__) assert(map.has(doc.id), "internal error");
        map.set(doc.id, downConverter(doc));
      }
    }
    if (docChanges.length == 1) {
      const change = docChanges[0];
      const doc = change.doc;
      if (change.type == "added") {
        items.splice(change.newIndex, 0, map.get(doc.id));
      } else if (change.type == "removed") {
        items.splice(change.oldIndex, 1);
      } else if (
        change.type == "modified" &&
        change.oldIndex === change.newIndex
      ) {
        items[change.newIndex] = map.get(doc.id);
      } else {
        items.replace(snapshot.docs.map((doc) => map.get(doc.id)));
      }
    } else {
      items.replace(snapshot.docs.map((doc) => map.get(doc.id)));
    }
    if (__DEV__) {
      const valid = snapshot.docs.every((doc, index) => {
        return (downConverter(doc) as any).id === (items[index] as any)?.id;
      });
      assert(valid, "internal error");
    }
  }
};

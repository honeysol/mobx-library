import type firebase from "firebase";

import { CoreDocument, downConverter } from "./core/CoreDocument";

type DocumentReference = firebase.firestore.DocumentReference;
type CollectionReference = firebase.firestore.CollectionReference;

export { downConverter };

export interface DocumentConstructor<D extends FirestoreDocument<unknown>> {
  new (params: {
    documentRef?: DocumentReference;
    collectionRef: CollectionReference;
  }): D;
  downConverter?: downConverter<DocumentType<D>>;
}
export type DocumentType<
  T extends FirestoreDocument<unknown>
> = T extends FirestoreDocument<infer P> ? P : never;

export class FirestoreDocument<R> extends CoreDocument<R> {
  collectionRef: CollectionReference;
  constructor({
    documentRef,
    downConverter,
    collectionRef,
  }: {
    documentRef?: DocumentReference;
    downConverter: downConverter<R>;
    collectionRef?: CollectionReference;
  }) {
    super({ documentRef, downConverter });
    if (!collectionRef || documentRef?.parent) {
      throw new Error("collectionRef or documentRef should be specified");
    }
    this.collectionRef = collectionRef || documentRef?.parent;
  }
}

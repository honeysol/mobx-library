import type firebase from "firebase";

import { CoreDocument, downConverter } from "./core/CoreDocument";
import type { FirestoreFactory } from "./FirestoreFactory";

type DocumentReference = firebase.firestore.DocumentReference;
type DocumentSnapshot = firebase.firestore.DocumentSnapshot;

export interface DocumentConstructor<
  D extends FirestoreDocument<unknown, B>,
  B
> {
  new (params: {
    documentRef: DocumentReference;
    factory: FirestoreFactory<FirestoreDocument<unknown, B>, B>;
  }): D;
  downConverter?: downConverter<DocumentType<D>>;
  generateId?: (data: DocumentType<D>) => string;
}

const defaultConverter = (snapshot: DocumentSnapshot) => snapshot.data();

export type DocumentType<
  T extends FirestoreDocument<unknown, unknown>
> = T extends FirestoreDocument<infer P, unknown> ? P : never;

export class FirestoreDocument<R, B> extends CoreDocument<R> {
  protected factory: FirestoreFactory<FirestoreDocument<R, B>, B>;
  constructor({
    documentRef,
    factory,
  }: {
    documentRef: DocumentReference;
    factory: FirestoreFactory<FirestoreDocument<R, B>, B>;
  }) {
    super({
      documentRef,
      downConverter:
        factory.downConverter || (defaultConverter as downConverter<R>),
    });
    this.factory = factory;
  }
}

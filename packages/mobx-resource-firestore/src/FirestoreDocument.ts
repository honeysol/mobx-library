import type firebase from "firebase";

import { CoreDocument, downConverter } from "./core/CoreDocument";
import type { FirestoreFactory } from "./FirestoreFactory";

type DocumentReference = firebase.firestore.DocumentReference;
type DocumentSnapshot = firebase.firestore.DocumentSnapshot;

export interface DocumentConstructor<D extends FirestoreDocument<unknown>> {
  new (params: {
    documentRef: DocumentReference;
    factory: FirestoreFactory<FirestoreDocument<unknown>>;
  }): D;
  downConverter?: downConverter<DocumentType<D>>;
  generateId?: (data: DocumentType<D>) => string;
}

const defaultConverter = (snapshot: DocumentSnapshot) => snapshot.data();

export type DocumentType<
  T extends FirestoreDocument<unknown>
> = T extends FirestoreDocument<infer P> ? P : never;

export class FirestoreDocument<R> extends CoreDocument<R> {
  constructor({
    documentRef,
    factory,
  }: {
    documentRef: DocumentReference;
    factory: FirestoreFactory<FirestoreDocument<R>>;
  }) {
    super({
      documentRef,
      downConverter:
        factory.downConverter || (defaultConverter as downConverter<R>),
    });
  }
}

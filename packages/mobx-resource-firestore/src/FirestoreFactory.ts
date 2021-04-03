import type firebase from "firebase";
import { memoize } from "mobx-memo";

import type { downConverter } from "./core/CoreDocument";
import type {
  DocumentConstructor,
  DocumentType,
  FirestoreDocument,
} from "./FirestoreDocument";
import { FirestoreQuery } from "./FirestoreQuery";
import { deriveQuery, QueryParams } from "./queryBuilder";

type Firestore = firebase.firestore.Firestore;

export class FirestoreFactory<D extends FirestoreDocument<unknown>> {
  constructor(
    private documentConstructor: DocumentConstructor<D>,
    private firestore: Firestore
  ) {}
  @memoize({})
  doc(path: string): D {
    return new this.documentConstructor({
      documentRef: this.firestore.doc(path),
      factory: this,
    });
  }
  @memoize({})
  query(path: string, queryParams?: QueryParams): FirestoreQuery<D> {
    return new FirestoreQuery<D>({
      query: deriveQuery(this.firestore.collection(path), queryParams),
      factory: this,
    });
  }
  get downConverter(): downConverter<DocumentType<D>> | undefined {
    return this.documentConstructor.downConverter;
  }
}

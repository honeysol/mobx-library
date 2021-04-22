import type firebase from "firebase";
import { memoize } from "mobx-memo";

import type { downConverter } from "./core/CoreDocument";
import type {
  DocumentConstructor,
  DocumentType,
  FirestoreDocument,
} from "./FirestoreDocument";
import { FirestoreQuery, FirestoreSimpleQuery } from "./FirestoreQuery";
import { deriveQuery, QueryParams } from "./queryBuilder";

type Firestore = firebase.firestore.Firestore;

export class FirestoreFactory<D extends FirestoreDocument<unknown, B>, B> {
  constructor(
    private documentConstructor: DocumentConstructor<D, B>,
    private firestore: Firestore,
    public database: B
  ) {}
  @memoize({})
  doc(path: string): D {
    return new this.documentConstructor({
      documentRef: this.firestore.doc(path),
      factory: this,
    });
  }
  @memoize({})
  query(path: string, queryParams?: QueryParams): FirestoreQuery<D, B> {
    return new FirestoreQuery<D, B>({
      query: deriveQuery(this.firestore.collection(path), queryParams),
      factory: this,
    });
  }
  @memoize({})
  simpleQuery(
    path: string,
    queryParams?: QueryParams
  ): FirestoreSimpleQuery<D, B> {
    return new FirestoreSimpleQuery<D, B>({
      query: deriveQuery(this.firestore.collection(path), queryParams),
      factory: this,
    });
  }
  get downConverter(): downConverter<DocumentType<D>> | undefined {
    return this.documentConstructor.downConverter;
  }
}

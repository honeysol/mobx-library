import type firebase from "firebase";

import { DocumentConstructor, FirestoreDocument } from "./FirestoreDocument";
import { FirestoreQuery } from "./FirestoreQuery";

type CollectionReference = firebase.firestore.CollectionReference;
type Query = firebase.firestore.Query;

export class FirestoreCollection<D extends FirestoreDocument<unknown>> {
  collectionRef: firebase.firestore.CollectionReference;
  documentConstructor: DocumentConstructor<D>;
  constructor({
    collectionRef,
    documentConstructor,
  }: {
    collectionRef: CollectionReference;
    documentConstructor: DocumentConstructor<D>;
  }) {
    this.collectionRef = collectionRef;
    this.documentConstructor = documentConstructor;
  }
  getDocument(documentId?: string): D {
    return new this.documentConstructor({
      documentRef: documentId ? this.collectionRef.doc(documentId) : undefined,
      collectionRef: this.collectionRef,
    });
  }
  getQuery(queryRef?: Query): FirestoreQuery<D> {
    return new FirestoreQuery({
      query: queryRef || this.collectionRef,
      documentConstructor: this.documentConstructor,
    });
  }
}

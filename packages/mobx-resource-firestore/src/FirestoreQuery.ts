import type firebase from "firebase";

import { CoreQuery } from "./core/CoreQuery";
import type {
  DocumentConstructor,
  DocumentType,
  FirestoreDocument,
} from "./FirestoreDocument";

type DocumentSnapshot = firebase.firestore.DocumentSnapshot;

type Query = firebase.firestore.Query;

interface ListItem<D extends FirestoreDocument<unknown>> {
  data: DocumentType<D>;
  doc: D;
  id: string;
}

export class FirestoreQuery<
  D extends FirestoreDocument<unknown>
> extends CoreQuery<ListItem<D>> {
  constructor({
    query,
    documentConstructor,
  }: {
    query: Query;
    documentConstructor: DocumentConstructor<D>;
  }) {
    const downConverter =
      documentConstructor.downConverter ||
      ((snapshot: DocumentSnapshot) => snapshot.data());

    super({
      query,
      downConverter: (snapshot: DocumentSnapshot) => ({
        id: snapshot.id,
        data: downConverter(snapshot) as DocumentType<D>,
        _doc: (undefined as unknown) as D,
        get doc(): D {
          const _this = this as ListItem<D> & { _doc: D };
          if (!_this._doc) {
            _this._doc = new documentConstructor({
              documentRef: snapshot.ref,
              collectionRef: snapshot.ref.parent,
            });
          }
          return _this._doc;
        },
      }),
    });
  }
}

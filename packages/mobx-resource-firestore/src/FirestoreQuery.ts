import type firebase from "firebase";

import { CoreQuery } from "./core/CoreQuery";
import type { DocumentType, FirestoreDocument } from "./FirestoreDocument";
import type { FirestoreFactory } from "./FirestoreFactory";

type DocumentSnapshot = firebase.firestore.DocumentSnapshot;
type Query = firebase.firestore.Query;

interface ListItem<D extends FirestoreDocument<unknown>> {
  data: DocumentType<D>;
  doc: D;
  id: string;
}

const defaultConverter = (snapshot: DocumentSnapshot) => snapshot.data();

export class FirestoreQuery<
  D extends FirestoreDocument<unknown>
> extends CoreQuery<ListItem<D>> {
  constructor({
    query,
    factory,
  }: {
    query: Query;
    factory: FirestoreFactory<D>;
  }) {
    const downConverter = factory.downConverter || defaultConverter;
    super({
      query,
      downConverter: (snapshot: DocumentSnapshot) => ({
        id: snapshot.id,
        data: downConverter(snapshot) as DocumentType<D>,
        _doc: (undefined as unknown) as D,
        get doc(): D {
          const _this = this as ListItem<D> & { _doc: D };
          if (!_this._doc) {
            _this._doc = factory.doc(snapshot.id);
          }
          return _this._doc;
        },
      }),
    });
  }
}

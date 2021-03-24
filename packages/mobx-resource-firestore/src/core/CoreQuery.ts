import type firebase from "firebase";
import { computed, IObservableArray, observable } from "mobx";
import { asyncComputedFrom } from "mobx-async-computed";
import { observed } from "mobx-observed";

import type { downConverter } from "./CoreDocument";

type Query = firebase.firestore.Query;

class QuerySession<R> {
  @observable promise?:
    | Promise<(R | undefined)[] | undefined>
    | (R | undefined)[];
  @observable items: (R | undefined)[] = observable.array<R | undefined>([], {
    deep: false,
  });
  cancelHandler?: () => void;
  constructor(query: Query, downConverter: downConverter<R>) {
    this.promise = new Promise((resolve, reject) => {
      this.cancelHandler = query.onSnapshot(
        (snapshot) => {
          const items = this.items as IObservableArray<R | undefined>;
          if (items.length === 0) {
            items.replace(snapshot.docs.map(downConverter) as R[]);
          } else {
            // TODO ここの実装が正しいか確認
            for (const change of snapshot.docChanges()) {
              if (change.type == "added") {
                items.splice(change.newIndex, 1, downConverter(change.doc));
              } else if (change.type == "removed") {
                items.splice(change.oldIndex, 1);
              } else if (change.type == "modified") {
                items.splice(change.oldIndex, 1);
                items.splice(change.newIndex, 0, downConverter(change.doc));
              }
            }
          }
          this.promise = this.items;
          // this resolve is ignored in the secondary access for the specification of Promise API
          resolve(this.items);
        },
        (error) => reject(error)
      );
    });
  }
  close() {
    this.cancelHandler?.();
  }
}

export class CoreQuery<R> {
  query?: Query;
  downConverter: downConverter<R>;
  constructor({
    query,
    downConverter,
  }: {
    query?: Query;
    downConverter: downConverter<R>;
  }) {
    this.query = query;
    this.downConverter = downConverter;
  }
  @observed.autoclose((session: QuerySession<R>) => session.close())
  get session(): QuerySession<R> | undefined {
    return this.query && new QuerySession(this.query, this.downConverter);
  }
  @computed
  get promise():
    | (R | undefined)[]
    | Promise<(R | undefined)[] | undefined>
    | undefined {
    return this.session?.promise;
  }
  @asyncComputedFrom("promise")
  items: (R | undefined)[] | undefined;
}

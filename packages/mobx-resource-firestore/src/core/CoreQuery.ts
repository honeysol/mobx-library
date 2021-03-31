import type firebase from "firebase";
import {
  IObservableArray,
  makeObservable,
  observable,
  runInAction,
} from "mobx";
import { autoclose } from "mobx-autoclose";

import type { downConverter } from "./CoreDocument";
import { reflectChange } from "./reflectChange";

type Query = firebase.firestore.Query;

class QuerySession<R> {
  @observable.ref promise?:
    | Promise<(R | undefined)[] | undefined>
    | (R | undefined)[] = undefined;
  @observable.ref
  items: IObservableArray<R | undefined> | undefined = undefined;
  map = new Map<string, R>();
  cancelHandler?: () => void;
  constructor(query: Query, downConverter: downConverter<R>) {
    makeObservable(this);
    this.promise = new Promise((resolve, reject) => {
      this.cancelHandler = query.onSnapshot(
        (snapshot) => {
          runInAction(() => {
            if (!this.items) {
              this.items = observable.array<R | undefined>([], {
                deep: false,
              });
            }
            reflectChange(snapshot, this.items, this.map, downConverter);
            this.promise = this.items;
          });
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
    makeObservable(this);
    this.query = query;
    this.downConverter = downConverter;
  }
  @autoclose({ cleanup: (session: QuerySession<R>) => session.close() })
  get session(): QuerySession<R> | undefined {
    return this.query && new QuerySession(this.query, this.downConverter);
  }
  get promise():
    | (R | undefined)[]
    | Promise<(R | undefined)[] | undefined>
    | undefined {
    return this.session?.promise;
  }
  get items(): (R | undefined)[] | undefined {
    return this.session?.items;
  }
}

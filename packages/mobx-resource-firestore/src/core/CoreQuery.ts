import type firebase from "firebase";
import { IObservableArray, observable, runInAction } from "mobx";
import { demand } from "mobx-demand";

import type { downConverter } from "./CoreDocument";
import { reflectChange } from "./reflectChange";
import { nonPromise, Promisable } from "./util";

type Query = firebase.firestore.Query;

class QuerySession<R> {
  private promiseAccessor = observable.box<
    Promisable<(R | undefined)[] | undefined>
  >();
  get promise(): Promisable<(R | undefined)[] | undefined> {
    return this.promiseAccessor.get();
  }
  set promise(value: Promisable<(R | undefined)[] | undefined>) {
    this.promiseAccessor.set(value);
  }
  map = new Map<string, R>();
  private cancelHandler?: () => void;
  private canceled?: boolean;
  constructor(
    queryPromise: Promisable<Query>,
    downConverter: downConverter<R>
  ) {
    let items: IObservableArray<R | undefined> | undefined = undefined;
    // eslint-disable-next-line no-async-promise-executor
    this.promise = new Promise(async (resolve, reject) => {
      const query = await queryPromise;
      if (this.canceled) {
        resolve(undefined);
        return;
      }
      this.cancelHandler = query.onSnapshot(
        (snapshot) => {
          runInAction(() => {
            if (!items) {
              items = observable.array<R | undefined>([], {
                deep: false,
              });
            }
            reflectChange(snapshot, items, this.map, downConverter);
            this.promise = items;
          });
          // this resolve is ignored in the secondary access for the specification of Promise API
          resolve(items);
        },
        (error) => reject(error)
      );
    });
  }
  close() {
    this.canceled = true;
    this.cancelHandler?.();
  }
}

export class CoreQuery<R> {
  protected queryPromise: Promisable<Query>;
  protected downConverter: downConverter<R>;
  constructor({
    query,
    downConverter,
  }: {
    query: Promisable<Query>;
    downConverter: downConverter<R>;
  }) {
    this.queryPromise = query;
    this.downConverter = downConverter;
  }
  private sessionAccessor = demand({
    get: () => new QuerySession(this.queryPromise, this.downConverter),
    cleanup: (session: QuerySession<R>) => session.close(),
    retentionTime: 2000,
  });
  protected get promise(): Promisable<(R | undefined)[] | undefined> {
    return this.sessionAccessor.get().promise;
  }
  protected get items(): (R | undefined)[] | undefined {
    return nonPromise(this.promise);
  }
  get map(): Map<string, R> {
    return this.sessionAccessor.get().map;
  }
}

import type firebase from "firebase";
import { observable, runInAction } from "mobx";
import { demand } from "mobx-demand";

import { nonPromise, Promisable } from "./util";

export type downConverter<R> = (snapshot: DocumentSnapshot) => R;

type DocumentReference = firebase.firestore.DocumentReference;
type DocumentSnapshot = firebase.firestore.DocumentSnapshot;

class DocumentSession<R> {
  private promiseAccessor = observable.box<Promisable<R | undefined>>();
  get promise(): Promisable<R | undefined> {
    return this.promiseAccessor.get();
  }
  set promise(value: Promisable<R | undefined>) {
    this.promiseAccessor.set(value);
  }
  private cancelHandler?: () => void;
  private canceled?: boolean;
  constructor(
    documentRefPromise: Promisable<DocumentReference | undefined>,
    downConverter: downConverter<R>
  ) {
    // eslint-disable-next-line no-async-promise-executor
    this.promise = new Promise(async (resolve, reject) => {
      const documentRef = await documentRefPromise;
      if (this.canceled || !documentRef) {
        resolve(undefined);
        return;
      }
      this.cancelHandler = documentRef.onSnapshot(
        (snapshot) => {
          runInAction(() => {
            this.promise = downConverter(snapshot);
          });
          // this resolve is ignored in the secondary access for the specification of Promise API
          resolve(this.promise);
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

export class CoreDocument<R> {
  private _documentRefPromise: Promisable<DocumentReference | undefined>;
  protected set documentRefPromise(
    value: Promisable<DocumentReference | undefined>
  ) {
    this._documentRefPromise = value;
    this.sessionAccessor.invalidate();
  }
  protected get documentRefPromise(): Promisable<
    DocumentReference | undefined
  > {
    return this._documentRefPromise;
  }
  private downConverter: downConverter<R>;
  constructor({
    documentRef,
    downConverter,
  }: {
    documentRef: Promisable<DocumentReference | undefined>;
    downConverter: downConverter<R>;
  }) {
    this._documentRefPromise = documentRef;
    this.downConverter = downConverter;
  }
  protected sessionAccessor = demand({
    get: () => new DocumentSession(this.documentRefPromise, this.downConverter),
    cleanup: (session: DocumentSession<R>) => session.close(),
    retentionTime: 2000,
  });
  get promise(): Promisable<R | undefined> {
    return this.sessionAccessor.get().promise;
  }
  get value(): R | undefined {
    return nonPromise(this.promise);
  }
  get exists(): boolean {
    return !!this.value;
  }
  async getExists(): Promise<boolean> {
    return !!(await this.promise);
  }
}

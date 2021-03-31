import type firebase from "firebase";
import { makeObservable, observable, runInAction } from "mobx";
import { autoclose } from "mobx-autoclose";

export type downConverter<R> = (snapshot: DocumentSnapshot) => R;

type DocumentReference = firebase.firestore.DocumentReference;
type DocumentSnapshot = firebase.firestore.DocumentSnapshot;

class DocumentSession<R> {
  @observable.ref promise?: Promise<R | undefined> | R = undefined;
  @observable.ref value?: R = undefined;
  cancelHandler?: () => void;
  constructor(documentRef: DocumentReference, downConverter: downConverter<R>) {
    makeObservable(this);
    this.promise = new Promise((resolve, reject) => {
      this.cancelHandler = documentRef.onSnapshot(
        (snapshot) => {
          runInAction(() => {
            this.value = this.promise = downConverter(snapshot);
          });
          // this resolve is ignored in the secondary access for the specification of Promise API
          resolve(this.promise);
        },
        (error) => reject(error)
      );
    });
  }
  close() {
    this.cancelHandler?.();
  }
}

export class CoreDocument<R> {
  @observable.ref
  documentRef?: DocumentReference = undefined;
  downConverter: downConverter<R>;
  constructor({
    documentRef,
    downConverter,
  }: {
    documentRef?: DocumentReference;
    downConverter: downConverter<R>;
  }) {
    makeObservable(this);
    this.documentRef = documentRef;
    this.downConverter = downConverter;
  }
  // これだとsessionが終了した後、再開しない
  @autoclose({ cleanup: (session: DocumentSession<R>) => session.close() })
  get session(): DocumentSession<R> | undefined {
    return (
      this.documentRef &&
      new DocumentSession(this.documentRef, this.downConverter)
    );
  }
  get promise(): Promise<R | undefined> | R | undefined {
    return this.session?.promise;
  }
  get value(): R | undefined {
    return this.session?.value;
  }
  get exists(): boolean | undefined {
    return !!this.value;
  }
  async getExists(): Promise<boolean | undefined> {
    await this.promise;
    return !!this.value;
  }
}

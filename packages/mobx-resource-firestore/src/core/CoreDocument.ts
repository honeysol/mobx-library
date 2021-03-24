import type firebase from "firebase";
import { computed, observable } from "mobx";
import { asyncComputed, asyncComputedFrom } from "mobx-async-computed";
import { observed } from "mobx-observed";

export type downConverter<R> = (snapshot: DocumentSnapshot) => R;

type DocumentReference = firebase.firestore.DocumentReference;
type DocumentSnapshot = firebase.firestore.DocumentSnapshot;

class DocumentSession<R> {
  @observable snapshot?: DocumentSnapshot;
  @observable promise?: Promise<R | undefined> | R;
  @observable value?: R;
  cancelHandler?: () => void;
  constructor(documentRef: DocumentReference, downConverter: downConverter<R>) {
    this.promise = new Promise((resolve, reject) => {
      this.cancelHandler = documentRef.onSnapshot(
        (snapshot) => {
          this.snapshot = snapshot;
          this.promise = this.value = downConverter(snapshot);
          // this resolve is ignored in the secondary access for the specification of Promise API
          resolve(this.value);
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
  @observable
  documentRef?: DocumentReference;
  downConverter: downConverter<R>;
  constructor({
    documentRef,
    downConverter,
  }: {
    documentRef?: DocumentReference;
    downConverter: downConverter<R>;
  }) {
    this.documentRef = documentRef;
    this.downConverter = downConverter;
  }
  @observed.autoclose((session: DocumentSession<R>) => session.close())
  get session(): DocumentSession<R> | undefined {
    return (
      this.documentRef &&
      new DocumentSession(this.documentRef, this.downConverter)
    );
  }
  @computed
  get promise(): Promise<R | undefined> | R | undefined {
    return this.session?.promise;
  }
  @asyncComputedFrom("promise")
  value: R | undefined;

  valueAccessor = asyncComputed({
    get: async () => {
      return this.promise;
    },
  });

  delete(): Promise<void> | undefined {
    return this.documentRef?.delete();
  }
  @computed
  get exists(): boolean | undefined {
    return this.session?.snapshot?.exists;
  }
  async getExists(): Promise<boolean | undefined> {
    await this.promise;
    return this.exists;
  }
}

// eslint-disable-next-line simple-import-sort/imports
import firebase from "firebase/app";
import "firebase/firestore";
import { FirestoreDocument, FirestoreFactory } from "mobx-resource-firestore";
import { MyDatabase } from "./MyDatabase";

type saveResponse = { type: "add"; id?: string } | { type: "update" };

type DocumentReference = firebase.firestore.DocumentReference;

interface UserDeviceModel {
  deviceId: string;
}

export class UserDevice extends FirestoreDocument<UserDeviceModel, MyDatabase> {
  constructor({
    factory,
    documentRef,
  }: {
    documentRef: DocumentReference;
    factory: FirestoreFactory<UserDevice, MyDatabase>;
  }) {
    super({ documentRef, factory });
  }
  async save(value: UserDeviceModel): Promise<saveResponse> {
    await this.documentRef.set(value, { merge: true });
    return { type: "update" };
  }
}

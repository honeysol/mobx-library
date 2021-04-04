// eslint-disable-next-line simple-import-sort/imports
import firebase from "firebase/app";
import "firebase/firestore";
import {
  FirestoreDocument,
  FirestoreQuery,
  FirestoreFactory,
} from "mobx-resource-firestore";
import type { MyDatabase } from "./MyDatabase";
import type { UserDevice } from "./UserDevice";

type saveResponse = { type: "add"; id?: string } | { type: "update" };

type DocumentSnapshot = firebase.firestore.DocumentSnapshot;
type DocumentReference = firebase.firestore.DocumentReference;

interface UserModel {
  firstName: string;
  lastName: string;
}

export class User extends FirestoreDocument<UserModel, MyDatabase> {
  static downConverter = (snapshot: DocumentSnapshot): UserModel => {
    const { firstName, lastName } = snapshot.data() || {};
    return {
      firstName,
      lastName,
    };
  };
  constructor({
    factory,
    documentRef,
  }: {
    documentRef: DocumentReference;
    factory: FirestoreFactory<User, MyDatabase>;
  }) {
    super({ documentRef, factory });
  }
  getUserDevices(): FirestoreQuery<UserDevice, MyDatabase> {
    return this.factory.database.userDeviceFactory.query(
      `users/${this.documentRef.id}/userDevices`
    );
  }
  async save(value: UserModel): Promise<saveResponse> {
    await this.documentRef.set(value, { merge: true });
    return { type: "update" };
  }
}

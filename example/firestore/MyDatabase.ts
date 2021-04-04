// eslint-disable-next-line simple-import-sort/imports
import firebase from "firebase/app";
import "firebase/firestore";

import { FirestoreFactory } from "mobx-resource-firestore";

type Firestore = firebase.firestore.Firestore;

import { User } from "./User";
import { UserDevice } from "./UserDevice";

export class MyDatabase {
  constructor(private firestore: Firestore) {}
  userFactory = new FirestoreFactory(User, this.firestore, this);
  userDeviceFactory = new FirestoreFactory(UserDevice, this.firestore, this);
}

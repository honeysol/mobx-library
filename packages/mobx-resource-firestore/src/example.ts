import firebase from "firebase";

import {
  FirestoreCollection,
  FirestoreDocument,
  FirestoreQuery,
} from "./index";

type saveResponse = { type: "add"; id?: string } | { type: "update" };

type DocumentSnapshot = firebase.firestore.DocumentSnapshot;
type DocumentReference = firebase.firestore.DocumentReference;
type CollectionReference = firebase.firestore.CollectionReference;
interface UserModel {
  firstName: string;
  lastName: string;
}

class User extends FirestoreDocument<UserModel> {
  static downConverter = (snapshot: DocumentSnapshot): UserModel => {
    const { firstName, lastName } = snapshot.data() || {};
    return {
      firstName,
      lastName,
    };
  };
  constructor({
    documentRef,
    collectionRef,
  }: {
    documentRef?: DocumentReference;
    collectionRef: CollectionReference;
  }) {
    super({ documentRef, collectionRef, downConverter: User.downConverter });
  }
  async save(value: UserModel): Promise<saveResponse> {
    if (!this.documentRef) {
      this.documentRef = this.collectionRef.doc();
      await this.documentRef.set(value);
      return { type: "add", id: this.documentRef.id };
    }
    await this.documentRef.update(value);
    return { type: "update" };
  }
}

firebase.initializeApp({});
const firestore = firebase.firestore();

const userCollection = new FirestoreCollection<User>({
  collectionRef: firestore.collection("/users"),
  documentConstructor: User,
});
const getUser = (userId: string): User => {
  return userCollection.getDocument(userId);
};
const getUsers = (): FirestoreQuery<User> => {
  return userCollection.getQuery();
};
const a = getUsers().items?.[0]?.doc;
const b = getUsers().items?.[0]?.data;

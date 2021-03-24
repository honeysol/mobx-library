## Overview

A simple and full-customizable wrapper of Firestore with MobX.

You can use this library like Object-Relaion Mapper of firestore.

## Example

```js
class User extends FirestoreDocument<UserModel> {
  // This static field is required and used by FirestoreQuery<UserModel>
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
  // This library doesn't touch the implementation of save method.
  async save(value: UserModel): Promise<saveResponse> {
    if (!this.documentRef) {
      this.documentRef = this.collectionRef.doc();
      await this.documentRef.set(value);
      return { type: "add", id: this.documentRef.id };
    }
    await this.documentRef.update(value);
    return { type: "update" };
  }
  // You can add any custom method.
  getUserDevices() {
    return new FirestoreQuery({
      query: deviceCollection.where("userId", "==", this.documentRef.id),
      documentConstructor: UserDevice,
    });
  }
}

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
```

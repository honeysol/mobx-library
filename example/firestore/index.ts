// eslint-disable-next-line simple-import-sort/imports
import firebase from "firebase/app";
import "firebase/firestore";

import { MyDatabase } from "./MyDatabase";

declare let window: any;
window.MyDatabase = MyDatabase;
window.firebase = firebase;

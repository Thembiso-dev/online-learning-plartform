// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";  // use Firestore, not Realtime DB

const firebaseConfig = {
  apiKey: "AIzaSyCCLBzqTcIkUSri8ocjQS5tJDkScH9kjBY",
  authDomain: "online-learning-platform-ee208.firebaseapp.com",
  projectId: "online-learning-platform-ee208",
  storageBucket: "online-learning-platform-ee208.appspot.com",
  messagingSenderId: "375631807009",
  appId: "1:375631807009:web:b418fc3ff979c65c329960",
  measurementId: "G-WKCL4T5L61"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);  // Firestore database instance

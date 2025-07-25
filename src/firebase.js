// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";


// First, just declare the config as a separate constant
const firebaseConfig = {
  apiKey: "AIzaSyCCLBzqTcIkUSri8ocjQS5tJDkScH9kjBY",
  authDomain: "online-learning-platform-ee208.firebaseapp.com",
  databaseURL: "https://online-learning-platform-ee208-default-rtdb.firebaseio.com",
  projectId: "online-learning-platform-ee208",
  storageBucket: "online-learning-platform-ee208.appspot.com",
  messagingSenderId: "375631807009",
  appId: "1:375631807009:web:b418fc3ff979c65c329960",
  measurementId: "G-WKCL4T5L61"
};

// Initialize Firebase app
const firebaseApp = initializeApp(firebaseConfig);

// Initialize services
const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);
const storage = getStorage(firebaseApp);

// Export as named exports
export { db, auth, storage };
export default firebaseApp;

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyADOHETQOJePBATlI2adkb_nbnYhy9yz5E",
  authDomain: "mdallal-sport.firebaseapp.com",
  projectId: "mdallal-sport",
  storageBucket: "mdallal-sport.firebasestorage.app",
  messagingSenderId: "655364359721",
  appId: "1:655364359721:web:47ea522eccdc478ae83e38"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };

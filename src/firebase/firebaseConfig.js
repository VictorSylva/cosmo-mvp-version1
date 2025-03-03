import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBiuNVVeCupuV9lg36R6dXdETsfUHW08uM",
  authDomain: "cosmocart-mvp.firebaseapp.com",
  projectId: "cosmocart-mvp",
  storageBucket: "cosmocart-mvp.firebasestorage.app",
  messagingSenderId: "1057950362344",
  appId: "1:1057950362344:web:0b4886ef31cf59aea6f75d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "",
  authDomain: "cosmocart-mvp.firebaseapp.com",
  projectId: "cosmocart-mvp",
  storageBucket: "cosmocart-mvp.firebasestorage.app",
  // storageBucket: "cosmocart-mvp.appspot.com", // ✅ Fixed storageBucket
  messagingSenderId: "1057950362344",
  appId: "1:1057950362344:web:0b4886ef31cf59aea6f75d",
  measurementId: "G-69SXLX66FH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export { analytics };

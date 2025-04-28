import { doc, setDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";

export const saveUserToFirestore = async (user) => {
  if (!user) return;

  const userRef = doc(db, "users", user.uid);
  await setDoc(userRef, {
    uid: user.uid,
    email: user.email,
    phone: user.phone || null,
    isPartnerStore: user.isPartnerStore || false,
    createdAt: new Date(),
  }, { merge: true });
};

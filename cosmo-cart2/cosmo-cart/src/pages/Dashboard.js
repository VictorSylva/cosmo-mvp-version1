import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

const Dashboard = () => {
  const [phone, setPhone] = useState("Loading...");

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setPhone(userDoc.data().phone || "Not Provided");
          } else {
            setPhone("User data not found");
          }
        } catch (error) {
          setPhone("Error fetching data");
          console.error("Error fetching user data:", error);
        }
      } else {
        setPhone("User not logged in");
      }
    };

    fetchUserData();
  }, []);

  return (
    <div>
      <h2>Welcome, {auth.currentUser?.email}</h2>
      <p>📞 Phone Number: {phone}</p>
    </div>
  );
};

export default Dashboard;

// src/components/Logout.js
import React from "react";
import { auth } from "../firebase/firebaseConfig";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const Logout = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      alert("Logged out successfully!");
      navigate("/login"); // Redirect to login page after logout
    } catch (err) {
      console.error("Error logging out:", err.message);
    }
  };

  return (
    <button
      onClick={handleLogout}
      style={{
        padding: "10px 20px",
        backgroundColor: "#dc3545",
        color: "white",
        border: "none",
        cursor: "pointer",
        borderRadius: "5px",
      }}
    >
      Logout
    </button>
  );
};

export default Logout;

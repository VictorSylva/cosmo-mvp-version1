// src/pages/Signup.js
import React, { useState } from "react";
import { auth } from "../firebase/firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "../styles/Signup.css";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate("/products");
    } catch (err) {
      setError(err.message);
      alert("Signup failed. Please try again.");
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-form">
        <h2>Sign Up</h2>
        {error && <p className="error-message">{error}</p>}
      <form onSubmit={handleSignup}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Sign Up</button>
        </form>
        <p>
          Already have an account?{" "}
          <span onClick={() => navigate("/login")} className="link">
            Login
          </span>
        </p>
        </div>
    </div>
  );
};

export default Signup;




// import React, { useState } from "react";
// import { auth } from "../firebase/firebaseConfig";
// import { createUserWithEmailAndPassword } from "firebase/auth";
// import { useNavigate } from "react-router-dom";
// import { toast, ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";

// const Signup = () => {
//   const [formData, setFormData] = useState({
//     email: "",
//     phone: "",
//     password: "",
//   });
//   const [error, setError] = useState("");
//   const navigate = useNavigate();

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const handleSignup = async (e) => {
//     e.preventDefault();
//     setError("");
//     try {
//       await createUserWithEmailAndPassword(auth, formData.email, formData.password);
//       toast.success("Signup successful! Redirecting to login...", { autoClose: 3000 });
//       setTimeout(() => navigate("/login"), 3000);
//     } catch (err) {
//       setError(err.message);
//       toast.error(err.message);
//     }
//   };

//   return (
//     <div style={{ maxWidth: "400px", margin: "50px auto", textAlign: "center" }}>
//       <h2>Signup</h2>
//       <ToastContainer />
//       <form onSubmit={handleSignup}>
//         <div>
//           <input
//             type="email"
//             name="email"
//             placeholder="Email"
//             value={formData.email}
//             onChange={handleChange}
//             required
//             style={{ padding: "10px", margin: "10px", width: "90%" }}
//           />
//         </div>
//         <div>
//           <input
//             type="tel"
//             name="phone"
//             placeholder="Phone Number"
//             value={formData.phone}
//             onChange={handleChange}
//             required
//             style={{ padding: "10px", margin: "10px", width: "90%" }}
//           />
//         </div>
//         <div>
//           <input
//             type="password"
//             name="password"
//             placeholder="Password"
//             value={formData.password}
//             onChange={handleChange}
//             required
//             style={{ padding: "10px", margin: "10px", width: "90%" }}
//           />
//         </div>
//         {error && <p style={{ color: "red" }}>{error}</p>}
//         <button
//           type="submit"
//           style={{
//             padding: "10px 20px",
//             backgroundColor: "#28a745",
//             color: "white",
//             border: "none",
//             cursor: "pointer",
//           }}
//         >
//           Signup
//         </button>
//       </form>
//       <p>Already have an account? <a href="/login">Login</a></p>
//     </div>
//   );
// };

// export default Signup;



// import React, { useState } from "react";
// import { auth } from "../firebase/firebaseConfig";
// import { createUserWithEmailAndPassword } from "firebase/auth";
// import { useNavigate } from "react-router-dom";
// import { toast, ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";

// const Signup = () => {
//   const [formData, setFormData] = useState({
//     email: "",
//     phone: "",
//     password: "",
//   });
//   const [error, setError] = useState("");
//   const navigate = useNavigate();

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const handleSignup = async (e) => {
//     e.preventDefault();
//     setError("");
//     try {
//       await createUserWithEmailAndPassword(auth, formData.email, formData.password);
//       toast.success("Signup successful! Redirecting to login...", { autoClose: 3000 });
//       setTimeout(() => navigate("/login"), 3000);
//     } catch (err) {
//       setError(err.message);
//       toast.error(err.message);
//     }
//   };

//   return (
//     <div style={{ maxWidth: "400px", margin: "50px auto", textAlign: "center" }}>
//       <h2>Signup</h2>
//       <ToastContainer />
//       <form onSubmit={handleSignup}>
//         <div>
//           <input
//             type="email"
//             name="email"
//             placeholder="Email"
//             value={formData.email}
//             onChange={handleChange}
//             required
//             style={{ padding: "10px", margin: "10px", width: "90%" }}
//           />
//         </div>
//         <div>
//           <input
//             type="tel"
//             name="phone"
//             placeholder="Phone Number"
//             value={formData.phone}
//             onChange={handleChange}
//             required
//             style={{ padding: "10px", margin: "10px", width: "90%" }}
//           />
//         </div>
//         <div>
//           <input
//             type="password"
//             name="password"
//             placeholder="Password"
//             value={formData.password}
//             onChange={handleChange}
//             required
//             style={{ padding: "10px", margin: "10px", width: "90%" }}
//           />
//         </div>
//         {error && <p style={{ color: "red" }}>{error}</p>}
//         <button
//           type="submit"
//           style={{
//             padding: "10px 20px",
//             backgroundColor: "#28a745",
//             color: "white",
//             border: "none",
//             cursor: "pointer",
//           }}
//         >
//           Signup
//         </button>
//       </form>
//       <p>Already have an account? <a href="/login">Login</a></p>
//     </div>
//   );
// };

// export default Signup;

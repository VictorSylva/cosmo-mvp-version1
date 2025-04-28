// src/pages/Login.js
import React, { useState } from "react";
import { auth } from "../firebase/firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/products");
    } catch (err) {
      setError(err.message);
      alert("Login failed. Please check your credentials.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
      <h2>Login</h2>
        {error && <p className="error-message">{error}</p>}
      <form onSubmit={handleLogin}>
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
          <button type="submit">Login</button>
      </form>
        <p>
          Don't have an account?{" "}
          <span onClick={() => navigate("/signup")} className="link">
            Sign up
          </span>
      </p>
      </div>
    </div>
  );
};

export default Login;



// // src/pages/Login.js
// import React, { useState } from "react";
// import { auth } from "../firebase/firebaseConfig";
// import { signInWithEmailAndPassword } from "firebase/auth";
// import { useNavigate } from "react-router-dom";
// import { toast, ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";

// const Login = () => {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const navigate = useNavigate();

//   const handleLogin = async (e) => {
//     e.preventDefault();
//     try {
//       await signInWithEmailAndPassword(auth, email, password);

//       // ✅ Success Toast Notification
//       toast.success("🎉 Login successful! Redirecting...", {
//         position: "top-right",
//         autoClose: 3000,
//         hideProgressBar: false,
//         closeOnClick: true,
//         pauseOnHover: true,
//         draggable: true,
//         theme: "colored",
//       });

//       // Redirect to products page after 3 seconds
//       setTimeout(() => navigate("/products"), 3000);
      
//     } catch (err) {
//       // ❌ Error Toast Notification
//       toast.error("❌ Login failed! " + err.message, {
//         position: "top-right",
//         autoClose: 5000,
//         hideProgressBar: false,
//         closeOnClick: true,
//         pauseOnHover: true,
//         draggable: true,
//         theme: "colored",
//       });
//     }
//   };

//   return (
//     <div style={{ maxWidth: "400px", margin: "50px auto", textAlign: "center" }}>
//       <h2>Login</h2>
//       <form onSubmit={handleLogin}>
//         <div>
//           <input
//             type="email"
//             placeholder="Email"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             required
//             style={{ padding: "10px", margin: "10px", width: "90%" }}
//           />
//         </div>
//         <div>
//           <input
//             type="password"
//             placeholder="Password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             required
//             style={{ padding: "10px", margin: "10px", width: "90%" }}
//           />
//         </div>
//         <button
//           type="submit"
//           style={{
//             padding: "10px 20px",
//             backgroundColor: "#007bff",
//             color: "white",
//             border: "none",
//             cursor: "pointer",
//           }}
//         >
//           Login
//         </button>
//       </form>

//       {/* ✅ Add ToastContainer here */}
//       <ToastContainer />
//     </div>
//   );
// };

// export default Login;

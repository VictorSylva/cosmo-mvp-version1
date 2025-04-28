// // src/pages/UserLookup.js
// import React, { useState, useEffect } from "react";
// import { collection, getDocs } from "firebase/firestore";
// import { db } from "../firebase/firebaseConfig";

// const UserLookup = () => {
//   const [users, setUsers] = useState([]);
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     const fetchUsers = async () => {
//       try {
//         const usersCollection = collection(db, "users");
//         const snapshot = await getDocs(usersCollection);
//         const userList = snapshot.docs.map((doc) => ({
//           id: doc.id, // This is the UID
//           ...doc.data(),
//         }));
//         setUsers(userList);
//       } catch (error) {
//         console.error("Error fetching users:", error);
//         alert("Failed to load users.");
//       }
//       setIsLoading(false);
//     };

//     fetchUsers();
//   }, []);

//   return (
//     <div style={{ maxWidth: "800px", margin: "50px auto", textAlign: "center" }}>
//       <h2>User Lookup</h2>
//       {isLoading ? (
//         <p>Loading users...</p>
//       ) : users.length === 0 ? (
//         <p>No users found.</p>
//       ) : (
//         <table
//           style={{
//             width: "100%",
//             borderCollapse: "collapse",
//             marginTop: "20px",
//           }}
//         >
//           <thead>
//             <tr style={{ backgroundColor: "#4CAF50", color: "white" }}>
//               <th style={{ padding: "10px", border: "1px solid #ddd" }}>Name</th>
//               <th style={{ padding: "10px", border: "1px solid #ddd" }}>Email</th>
//               <th style={{ padding: "10px", border: "1px solid #ddd" }}>User ID (UID)</th>
//             </tr>
//           </thead>
//           <tbody>
//             {users.map((user) => (
//               <tr key={user.id}>
//                 <td style={{ padding: "10px", border: "1px solid #ddd" }}>
//                   {user.displayName || "N/A"}
//                 </td>
//                 <td style={{ padding: "10px", border: "1px solid #ddd" }}>
//                   {user.email || "N/A"}
//                 </td>
//                 <td style={{ padding: "10px", border: "1px solid #ddd" }}>{user.id}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       )}
//     </div>
//   );
// };

// export default UserLookup;

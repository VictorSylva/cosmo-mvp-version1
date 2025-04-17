import React, { useEffect, useState } from "react";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { motion } from "framer-motion";

const Wallet = () => {
  const [walletItems, setWalletItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [user, setUser] = useState(null);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [redemptionId, setRedemptionId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        navigate("/login");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const fetchWalletItems = async () => {
      if (!user) return;

      try {
        const walletRef = collection(db, "users", user.uid, "wallet");
        const walletSnapshot = await getDocs(walletRef);
        const items = walletSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setWalletItems(items);
      } catch (err) {
        console.error("Error fetching wallet items:", err.message);
      }
    };

    fetchWalletItems();
  }, [user]);

  const handleSelectItem = (itemId) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
    // Clear any previous QR code when selection changes
    setQrCodeData(null);
    setRedemptionId(null);
  };

  const generateQrCode = async () => {
    if (selectedItems.length === 0) {
      alert("Please select at least one item to retrieve.");
      return;
    }

    try {
      // Get the first selected item (for simplicity, we'll handle one item at a time)
      const selectedItem = walletItems.find(item => selectedItems.includes(item.id));
      
      if (!selectedItem) {
        alert("Selected item not found.");
        return;
      }

      // Create a redemption record in Firestore
      const redemptionsRef = collection(db, "redemptions");
      const newRedemption = {
        userId: user.uid,
        userName: user.displayName || user.email,
        productID: selectedItem.productId,
        productName: selectedItem.productName,
        prepaidPrice: selectedItem.productPrice,
        currentPrice: selectedItem.productPrice, // This will be compared with partner store price
        status: "pending",
        createdAt: serverTimestamp(),
        productImage: selectedItem.imageUrl || "",
      };

      // Add the redemption to Firestore
      const redemptionDoc = await addDoc(redemptionsRef, newRedemption);
      
      // Store the redemption ID
      setRedemptionId(redemptionDoc.id);
      
      // The QR code will contain just the redemption ID
      // The partner store will use this ID to look up the full details
      setQrCodeData(redemptionDoc.id);
    } catch (error) {
      console.error("Error generating redemption:", error);
      alert("Failed to generate QR code. Please try again.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ maxWidth: "800px", margin: "50px auto", color: "#095859" }}
    >
      <h2>Your Wallet</h2>
      <button
        onClick={() => navigate("/products")}
        style={{
          marginBottom: "20px",
          padding: "10px",
          backgroundColor: "#095859",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          transition: "0.3s",
        }}
        onMouseOver={(e) => (e.target.style.backgroundColor = "#0B6A6F")}
        onMouseOut={(e) => (e.target.style.backgroundColor = "#095859")}
      >
        Back to Products
      </button>
      {walletItems.length === 0 ? (
        <p>You have no prepaid items in your wallet.</p>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
          {walletItems.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              style={{
                border: selectedItems.includes(item.id) ? "2px solid #095859" : "1px solid #ccc",
                padding: "15px",
                width: "200px",
                borderRadius: "5px",
                textAlign: "center",
                backgroundColor: selectedItems.includes(item.id) ? "#f0f7f7" : "#f9f9f9",
              }}
            >
              <img
                src={item.imageUrl || "https://via.placeholder.com/150"}
                alt={item.productName}
                style={{ width: "100%", height: "150px", objectFit: "cover" }}
              />
              <h3>{item.productName}</h3>
              <p>Price: ₦{item.productPrice}</p>
              <label>
                <input
                  type="checkbox"
                  checked={selectedItems.includes(item.id)}
                  onChange={() => handleSelectItem(item.id)}
                />
                Select for Retrieval
              </label>
            </motion.div>
          ))}
        </div>
      )}
      <button
        onClick={generateQrCode}
        disabled={selectedItems.length === 0}
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          backgroundColor: selectedItems.length === 0 ? "#ccc" : "#095859",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: selectedItems.length === 0 ? "not-allowed" : "pointer",
          transition: "0.3s",
        }}
        onMouseOver={(e) => {
          if (selectedItems.length > 0) {
            e.target.style.backgroundColor = "#0B6A6F";
          }
        }}
        onMouseOut={(e) => {
          if (selectedItems.length > 0) {
            e.target.style.backgroundColor = "#095859";
          }
        }}
      >
        Generate QR Code
      </button>
      {qrCodeData && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          style={{ 
            marginTop: "20px", 
            textAlign: "center",
            padding: "20px",
            backgroundColor: "#f0f7f7",
            borderRadius: "8px"
          }}
        >
          <h3>QR Code for Retrieval</h3>
          <p>Show this QR code to the partner store to retrieve your items</p>
          <QRCodeSVG value={qrCodeData} size={200} />
          <p style={{ fontSize: "12px", marginTop: "10px", color: "#555" }}>
            Redemption ID: {redemptionId}
          </p>
          <p style={{ fontSize: "12px", color: "#777" }}>
            This QR code will expire in 24 hours
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Wallet;



// import React, { useEffect, useState } from "react";
// import { collection, getDocs } from "firebase/firestore";
// import { db, auth } from "../firebase/firebaseConfig";
// import { onAuthStateChanged } from "firebase/auth";
// import { useNavigate } from "react-router-dom";
// import { QRCodeSVG } from "qrcode.react";
// import { motion } from "framer-motion";


// const Wallet = () => {
//   const [walletItems, setWalletItems] = useState([]);
//   const [selectedItems, setSelectedItems] = useState([]);
//   const [user, setUser] = useState(null);
//   const [qrCodeData, setQrCodeData] = useState(null);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
//       if (currentUser) {
//         setUser(currentUser);
//       } else {
//         navigate("/login");
//       }
//     });

//     return () => unsubscribe();
//   }, [navigate]);

//   useEffect(() => {
//     const fetchWalletItems = async () => {
//       if (!user) return;

//       try {
//         const walletRef = collection(db, "users", user.uid, "wallet");
//         const walletSnapshot = await getDocs(walletRef);
//         const items = walletSnapshot.docs.map((doc) => ({
//           id: doc.id,
//           ...doc.data(),
//         }));
//         setWalletItems(items);
//       } catch (err) {
//         console.error("Error fetching wallet items:", err.message);
//       }
//     };

//     fetchWalletItems();
//   }, [user]);

//   const handleSelectItem = (itemId) => {
//     setSelectedItems((prev) =>
//       prev.includes(itemId)
//         ? prev.filter((id) => id !== itemId)
//         : [...prev, itemId]
//     );
//   };

//   const generateQrCode = () => {
//     if (selectedItems.length === 0) {
//       alert("Please select at least one item to retrieve.");
//       return;
//     }

//     const selectedProducts = walletItems.filter((item) =>
//       selectedItems.includes(item.id)
//     );
//     const qrData = {
//       userId: user.uid,
//       products: selectedProducts.map((item) => ({
//         id: item.productId,
//         name: item.productName,
//         price: item.productPrice,
//       })),
//     };
//     setQrCodeData(JSON.stringify(qrData));
//   };

//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 20 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ duration: 0.5 }}
//       style={{ maxWidth: "800px", margin: "50px auto", color: "#095859" }}
//     >
//       <h2>Your Wallet</h2>
//       <button
//         onClick={() => navigate("/products")}
//         style={{
//           marginBottom: "20px",
//           padding: "10px",
//           backgroundColor: "#095859",
//           color: "white",
//           border: "none",
//           borderRadius: "5px",
//           cursor: "pointer",
//           transition: "0.3s",
//         }}
//         onMouseOver={(e) => (e.target.style.backgroundColor = "#0B6A6F")}
//         onMouseOut={(e) => (e.target.style.backgroundColor = "#095859")}
//       >
//         Back to Products
//       </button>
//       {walletItems.length === 0 ? (
//         <p>You have no prepaid items in your wallet.</p>
//       ) : (
//         <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
//           {walletItems.map((item) => (
//             <motion.div
//               key={item.id}
//               initial={{ opacity: 0, scale: 0.9 }}
//               animate={{ opacity: 1, scale: 1 }}
//               transition={{ duration: 0.4 }}
//               style={{
//                 border: "1px solid #ccc",
//                 padding: "15px",
//                 width: "200px",
//                 borderRadius: "5px",
//                 textAlign: "center",
//                 backgroundColor: "#f9f9f9",
//               }}
//             >
//               <img
//                 src={item.imageUrl || "https://via.placeholder.com/150"}
//                 alt={item.productName}
//                 style={{ width: "100%", height: "150px", objectFit: "cover" }}
//               />
//               <h3>{item.productName}</h3>
//               <p>Price: ₦{item.productPrice}</p>
//               <label>
//                 <input
//                   type="checkbox"
//                   checked={selectedItems.includes(item.id)}
//                   onChange={() => handleSelectItem(item.id)}
//                 />
//                 Select for Retrieval
//               </label>
//             </motion.div>
//           ))}
//         </div>
//       )}
//       <button
//         onClick={generateQrCode}
//         style={{
//           marginTop: "20px",
//           padding: "10px 20px",
//           backgroundColor: "#095859",
//           color: "white",
//           border: "none",
//           borderRadius: "5px",
//           cursor: "pointer",
//           transition: "0.3s",
//         }}
//         onMouseOver={(e) => (e.target.style.backgroundColor = "#0B6A6F")}
//         onMouseOut={(e) => (e.target.style.backgroundColor = "#095859")}
//       >
//         Generate QR Code
//       </button>
//       {qrCodeData && (
//         <motion.div
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           transition={{ duration: 0.5 }}
//           style={{ marginTop: "20px", textAlign: "center" }}
//         >
//           <h3>QR Code for Retrieval</h3>
//           <QRCodeSVG value={qrCodeData} size={200} />
//         </motion.div>
//       )}
//     </motion.div>
//   );
// };

// export default Wallet;




// // src/pages/Wallet.js
// import React, { useEffect, useState } from "react";
// import { collection, getDocs } from "firebase/firestore";
// import { db, auth } from "../firebase/firebaseConfig";
// import { onAuthStateChanged } from "firebase/auth";
// import { useNavigate } from "react-router-dom";

// const Wallet = () => {
//   const [walletItems, setWalletItems] = useState([]);
//   const [user, setUser] = useState(null);
//   const navigate = useNavigate();

//   useEffect(() => {
//     // Check if user is logged in
//     const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
//       if (currentUser) {
//         setUser(currentUser);
//       } else {
//         navigate("/login"); // Redirect to login if not logged in
//       }
//     });

//     return () => unsubscribe();
//   }, [navigate]);

//   useEffect(() => {
//     // Fetch wallet items from Firestore
//     const fetchWalletItems = async () => {
//       if (!user) return;

//       try {
//         const walletRef = collection(db, "users", user.uid, "wallet");
//         const walletSnapshot = await getDocs(walletRef);
//         const items = walletSnapshot.docs.map((doc) => ({
//           id: doc.id,
//           ...doc.data(),
//         }));
//         setWalletItems(items);
//       } catch (err) {
//         console.error("Error fetching wallet items:", err.message);
//       }
//     };

//     fetchWalletItems();
//   }, [user]);

//   return (
//     <div style={{ maxWidth: "800px", margin: "50px auto" }}>
//       <h2>Your Wallet</h2>
//       {walletItems.length === 0 ? (
//         <p>You have no prepaid items in your wallet.</p>
//       ) : (
//         <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
//           {walletItems.map((item) => (
//             <div
//               key={item.id}
//               style={{
//                 border: "1px solid #ccc",
//                 padding: "15px",
//                 width: "200px",
//                 borderRadius: "5px",
//                 textAlign: "center",
//               }}
//             >
//               <img
//                 src={item.imageUrl || "https://via.placeholder.com/150"}
//                 alt={item.productName}
//                 style={{ width: "100%", height: "150px", objectFit: "cover" }}
//               />
//               <h3>{item.productName}</h3>
//               <p>Price: ₦{item.productPrice}</p>
//               <p>Date: {new Date(item.createdAt.seconds * 1000).toLocaleDateString()}</p>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default Wallet;

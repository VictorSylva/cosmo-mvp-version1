import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
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
  };

  const generateQrCode = () => {
    if (selectedItems.length === 0) {
      alert("Please select at least one item to retrieve.");
      return;
    }

    const selectedProducts = walletItems.filter((item) =>
      selectedItems.includes(item.id)
    );
    const qrData = {
      userId: user.uid,
      products: selectedProducts.map((item) => ({
        id: item.productId,
        name: item.productName,
        price: item.productPrice,
      })),
    };
    setQrCodeData(JSON.stringify(qrData));
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
                border: "1px solid #ccc",
                padding: "15px",
                width: "200px",
                borderRadius: "5px",
                textAlign: "center",
                backgroundColor: "#f9f9f9",
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
        style={{
          marginTop: "20px",
          padding: "10px 20px",
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
        Generate QR Code
      </button>
      {qrCodeData && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          style={{ marginTop: "20px", textAlign: "center" }}
        >
          <h3>QR Code for Retrieval</h3>
          <QRCodeSVG value={qrCodeData} size={200} />
        </motion.div>
      )}
    </motion.div>
  );
};

export default Wallet;




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

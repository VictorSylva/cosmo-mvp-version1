import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { collection, getDocs, setDoc, doc, getDoc, updateDoc, query, where } from "firebase/firestore";
import { db, auth } from "../firebase/firebaseConfig";
import { QrReader } from "@blackbox-vision/react-qr-reader";

// Simulated Partner Store ID (Replace with actual auth logic)
const partnerID = "partner_store_123";

const PartnerStoreDashboard = () => {
  const [products, setProducts] = useState([]);
  const [priceInputs, setPriceInputs] = useState({});
  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const navigate = useNavigate();

  // Fetch main products and partner-specific prices
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Get all products from the main collection
        const productSnapshot = await getDocs(collection(db, "products"));
        const productsData = productSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Query partner store prices for the logged-in partner
        const priceQuery = query(
          collection(db, "partner_store_prices"),
          where("partnerID", "==", partnerID)
        );
        const priceSnapshot = await getDocs(priceQuery);
        const priceData = priceSnapshot.docs.reduce((acc, doc) => {
          const data = doc.data();
          acc[data.productId] = data.price;
          return acc;
        }, {});

        // Merge product data with the partner store's prices
        const updatedProducts = productsData.map((product) => ({
          ...product,
          // If there's a partner-specific price, use it; otherwise, use the main product price
          partnerPrice: priceData[product.id] ?? product.price,
        }));

        setProducts(updatedProducts);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchProducts();
  }, []);

  // Update local input state
  const handlePriceChange = (id, newPrice) => {
    setPriceInputs((prev) => ({
      ...prev,
      [id]: newPrice,
    }));
  };

  // Update the partner-specific price in Firestore
  const updatePriceInFirestore = async (id) => {
    const newPrice = priceInputs[id];
    if (!newPrice) return; // Do nothing if the input is empty

    try {
      // Document ID is based on partnerID and product id to keep it unique
      const priceDocId = `${partnerID}_${id}`;
      await setDoc(doc(db, "partner_store_prices", priceDocId), { 
        price: Number(newPrice), 
        partnerID, 
        productId: id 
      }, { merge: true });

      // Update local state to reflect the new partner price
      setProducts((prevProducts) =>
        prevProducts.map((product) =>
          product.id === id ? { ...product, partnerPrice: Number(newPrice) } : product
        )
      );

      alert("Price updated successfully!");
    } catch (error) {
      console.error("Error updating price:", error);
    }
  };

  // Handle QR code scan for redemptions
  const handleScan = async (data) => {
    if (data) {
      try {
        const redemptionRef = doc(db, "redemptions", data);
        const redemptionSnap = await getDoc(redemptionRef);

        if (redemptionSnap.exists()) {
          const productID = redemptionSnap.data().productID;
          const productRef = doc(db, "products", productID);
          const productSnap = await getDoc(productRef);

          if (productSnap.exists()) {
            // Get the partner-specific price for the scanned product
            const partnerPriceRef = doc(db, "partner_store_prices", `${partnerID}_${productID}`);
            const partnerPriceSnap = await getDoc(partnerPriceRef);
            const partnerPrice = partnerPriceSnap.exists() ? partnerPriceSnap.data().price : productSnap.data().price;

            setScanResult({
              id: data,
              productName: productSnap.data().name,
              prepaidPrice: redemptionSnap.data().prepaidPrice,
              currentPrice: partnerPrice,
              productImage: productSnap.data().image,
            });
            setIsScanning(false);
          }
        } else {
          console.log("No redemption found");
        }
      } catch (error) {
        console.error("Error fetching redemption details:", error);
      }
    }
  };

  const handleConfirmRedemption = async () => {
    if (scanResult) {
      try {
        const redemptionRef = doc(db, "redemptions", scanResult.id);
        await updateDoc(redemptionRef, { status: "confirmed" });
        setScanResult(null);
        alert("Redemption confirmed successfully!");
      } catch (error) {
        console.error("Error confirming redemption:", error);
      }
    }
  };

  const handleRejectRedemption = async () => {
    if (scanResult) {
      try {
        const redemptionRef = doc(db, "redemptions", scanResult.id);
        await updateDoc(redemptionRef, { status: "rejected" });
        setScanResult(null);
        alert("Redemption rejected.");
      } catch (error) {
        console.error("Error rejecting redemption:", error);
      }
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/partner-login");
  };

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Partner Store Dashboard</h1>
        <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded">
          Logout
        </button>
      </div>

      <h2 className="text-xl font-semibold mb-4">Manage Product Prices</h2>
      <div className="bg-white p-4 rounded shadow">
        <table className="w-full border-collapse border border-gray-200">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">Product</th>
              <th className="border p-2">Prepaid Price</th>
              <th className="border p-2">Partner Store Price</th>
              <th className="border p-2">Update Price</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="text-center">
                <td className="border p-2">{product.name}</td>
                <td className="border p-2">₦{product.price}</td>
                <td className="border p-2">₦{product.partnerPrice}</td>
                <td className="border p-2">
                  <input
                    type="number"
                    placeholder="Enter new price"
                    value={priceInputs[product.id] ?? ""}
                    onChange={(e) => handlePriceChange(product.id, e.target.value)}
                    className="border p-1 w-20 text-center"
                  />
                  <button
                    onClick={() => updatePriceInFirestore(product.id)}
                    className="ml-2 bg-blue-500 text-white px-2 py-1 rounded"
                  >
                    Save
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="text-xl font-semibold mt-6">Scan Customer QR Code</h2>
      <div className="bg-white p-4 rounded shadow mt-2">
        {!isScanning ? (
          <button
            onClick={() => setIsScanning(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Start Scanning
          </button>
        ) : (
          <>
            <QrReader
              constraints={{ facingMode: "environment" }}
              onResult={(result, error) => {
                if (result) {
                  handleScan(result?.text);
                  setIsScanning(false); // Stop scanning after reading
                }
                if (error) {
                  console.error("QR Scanner Error:", error);
                }
              }}
              style={{ width: "100%" }}
            />
            <button
              onClick={() => setIsScanning(false)}
              className="bg-red-500 text-white px-4 py-2 rounded mt-2"
            >
              Stop Scanning
            </button>
          </>
        )}
      </div>

      {scanResult && (
        <div className="bg-white p-4 rounded shadow mt-4">
          <h3 className="text-lg font-semibold">Redemption Details</h3>
          <p>
            <strong>Product:</strong> {scanResult.productName}
          </p>
          <p>
            <strong>Prepaid Price:</strong> ₦{scanResult.prepaidPrice}
          </p>
          <p>
            <strong>Current Price:</strong> ₦{scanResult.currentPrice}
          </p>
          <img
            src={scanResult.productImage}
            alt="Product"
            className="w-32 h-32 mt-2"
          />
          <div className="mt-4">
            <button
              onClick={handleConfirmRedemption}
              className="bg-green-500 text-white px-4 py-2 rounded mr-2"
            >
              Confirm
            </button>
            <button
              onClick={handleRejectRedemption}
              className="bg-red-500 text-white px-4 py-2 rounded"
            >
              Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerStoreDashboard;



// import { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { signOut } from "firebase/auth";
// import { collection, getDocs, updateDoc, doc, getDoc } from "firebase/firestore";
// import { db, auth } from "../firebase/firebaseConfig"; // Firestore instance
// import { QrReader } from "@blackbox-vision/react-qr-reader";

// const PartnerStoreDashboard = () => {
//   const [products, setProducts] = useState([]);
//   const [scanResult, setScanResult] = useState(null);
//   const [isScanning, setIsScanning] = useState(false);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const fetchProducts = async () => {
//       try {
//         const querySnapshot = await getDocs(collection(db, "products"));
//         const productList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
//         setProducts(productList);
//       } catch (error) {
//         console.error("Error fetching products:", error);
//       }
//     };

//     fetchProducts();
//   }, []);

//   const handlePriceChange = async (id, newPrice) => {
//     try {
//       const productRef = doc(db, "products", id);
//       await updateDoc(productRef, { price: Number(newPrice) });
//       setProducts((prevProducts) =>
//         prevProducts.map((product) =>
//           product.id === id ? { ...product, price: Number(newPrice) } : product
//         )
//       );
//     } catch (error) {
//       console.error("Error updating price:", error);
//     }
//   };

//   const handleScan = async (data) => {
//     if (data) {
//       try {
//         const redemptionRef = doc(db, "redemptions", data);
//         const redemptionSnap = await getDoc(redemptionRef);
//         if (redemptionSnap.exists()) {
//           setScanResult({ id: data, ...redemptionSnap.data() });
//         } else {
//           console.log("No redemption found");
//         }
//       } catch (error) {
//         console.error("Error fetching redemption details:", error);
//       }
//     }
//   };

//   const handleConfirmRedemption = async () => {
//     if (scanResult) {
//       try {
//         const redemptionRef = doc(db, "redemptions", scanResult.id);
//         await updateDoc(redemptionRef, { status: "confirmed" });
//         setScanResult(null);
//         alert("Redemption confirmed successfully!");
//       } catch (error) {
//         console.error("Error confirming redemption:", error);
//       }
//     }
//   };

//   const handleRejectRedemption = async () => {
//     if (scanResult) {
//       try {
//         const redemptionRef = doc(db, "redemptions", scanResult.id);
//         await updateDoc(redemptionRef, { status: "rejected" });
//         setScanResult(null);
//         alert("Redemption rejected.");
//       } catch (error) {
//         console.error("Error rejecting redemption:", error);
//       }
//     }
//   };

//   const handleLogout = async () => {
//     await signOut(auth);
//     navigate("/partner-login");
//   };

//   return (
//     <div className="min-h-screen p-6 bg-gray-100">
//       <div className="flex justify-between items-center mb-4">
//         <h1 className="text-2xl font-bold">Partner Store Dashboard</h1>
//         <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded">Logout</button>
//       </div>

//       <h2 className="text-xl font-semibold mb-4">Manage Product Prices</h2>
//       <div className="bg-white p-4 rounded shadow">
//         <table className="w-full border-collapse border border-gray-200">
//           <thead>
//             <tr className="bg-gray-200">
//               <th className="border p-2">Product</th>
//               <th className="border p-2">Current Price</th>
//               <th className="border p-2">Update Price</th>
//             </tr>
//           </thead>
//           <tbody>
//             {products.map((product) => (
//               <tr key={product.id} className="text-center">
//                 <td className="border p-2">{product.name}</td>
//                 <td className="border p-2">₦{product.price}</td>
//                 <td className="border p-2">
//                   <input
//                     type="number"
//                     defaultValue={product.price}
//                     onBlur={(e) => handlePriceChange(product.id, e.target.value)}
//                     className="border p-1 w-20 text-center"
//                   />
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       <h2 className="text-xl font-semibold mt-6">Scan Customer QR Code</h2>
//       <div className="bg-white p-4 rounded shadow mt-2">
//         {!isScanning ? (
//           <button
//             onClick={() => setIsScanning(true)}
//             className="bg-blue-500 text-white px-4 py-2 rounded"
//           >
//             Start Scanning
//           </button>
//         ) : (
//           <>
//             <QrReader
//               constraints={{ facingMode: "environment" }}
//               onResult={(result, error) => {
//                 if (result) {
//                   handleScan(result?.text);
//                   setIsScanning(false); // Stop scanning after reading
//                 }
//                 if (error) {
//                   console.error("QR Scanner Error:", error);
//                 }
//               }}
//               style={{ width: "100%" }}
//             />
//             <button
//               onClick={() => setIsScanning(false)}
//               className="bg-red-500 text-white px-4 py-2 rounded mt-2"
//             >
//               Stop Scanning
//             </button>
//           </>
//         )}
//       </div>

//       {scanResult && (
//         <div className="bg-white p-4 rounded shadow mt-4">
//           <h3 className="text-lg font-semibold">Redemption Details</h3>
//           <p><strong>Product:</strong> {scanResult.productName}</p>
//           <p><strong>Prepaid Price:</strong> ₦{scanResult.prepaidPrice}</p>
//           <p><strong>Current Price:</strong> ₦{scanResult.currentPrice}</p>
//           <img src={scanResult.productImage} alt="Product" className="w-32 h-32 mt-2" />
//           <div className="mt-4">
//             <button onClick={handleConfirmRedemption} className="bg-green-500 text-white px-4 py-2 rounded mr-2">Confirm</button>
//             <button onClick={handleRejectRedemption} className="bg-red-500 text-white px-4 py-2 rounded">Reject</button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default PartnerStoreDashboard;

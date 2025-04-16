import React, { useEffect, useState } from "react";
import { addDoc, collection, getDocs } from "firebase/firestore";
import { db, auth } from "../firebase/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { PaystackButton } from "react-paystack";
import { motion } from "framer-motion";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../styles/Products.css";
import CosmoCartLogo from "../assets/cosmocart-logo.png"; // Add your logo


const Products = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [priceRange, setPriceRange] = useState(100000);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const publicKey = "pk_test_80cd454009d341493a2268547cf40ef0ad5a12c8";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        navigate("/login");
      }
    });

    return () => unsubscribe(); // Cleanup
  }, [navigate]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsSnapshot = await getDocs(collection(db, "products"));
        const items = productsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setProducts(items);
        setFilteredProducts(items);
      } catch (err) {
        console.error("Error fetching products:", err.message);
        toast.error("🚨 Failed to load products. Please try again later.");
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const filtered = products.filter(
      (product) =>
        (selectedCategory === "All" || product.category === selectedCategory) &&
        product.price <= priceRange
    );
    setFilteredProducts(filtered);
  }, [selectedCategory, priceRange, products]);

  const handlePrepay = async (product, reference) => {
    if (!user || !product) return;

    try {
      const userWalletRef = collection(db, "users", user.uid, "wallet");
      await addDoc(userWalletRef, {
        productId: product.id,
        productName: product.name,
        productPrice: product.price,
        imageUrl: product.imageUrl,
        createdAt: new Date(),
        paymentRef: reference.reference,
      });

      toast.success(`✅ Payment successful! You have prepaid for ${product.name}`);
    } catch (err) {
      console.error("Error adding product to wallet:", err.message);
      toast.error("❌ Failed to update wallet. Please contact support.");
    }
  };

  return (
    <div className="page-container">
      {/* Fixed Header Section */}
      <header className="header-container">
        <img className="logo" src={CosmoCartLogo} alt="CosmoCart Logo" />
        <button
        onClick={() => navigate("/partner-store-dashboard")}
        className="bg-green-500 text-white px-4 py-2 rounded"
      >
        Partner Store
      </button>
        <button className="wallet-button" onClick={() => navigate("/wallet")}>Go to Wallet</button>
      </header>

      {/* Main Content Layout */}
      <div className="main-content">
        {/* Sidebar - Filters */}
        <aside className="sidebar">
          <h3>Filter Products</h3>
          <label className="sidebar-label">Category:</label>
          <select className="sidebar-select" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
            <option value="All">All</option>
            <option value="Grains">Grains</option>
            <option value="Fats">Fats</option>
            <option value="Fruits & Vegetables">Fruits & Vegetables</option>
            <option value="Dairy">Dairy</option>
            <option value="Proteins">Proteins</option>
            <option value="Starchy Food">Starchy Food</option>
            <option value="Hydrations">Hydrations</option>
          </select>

          <label className="sidebar-label">Max Price: ₦{priceRange.toLocaleString()}</label>
          <input
            type="range"
            min="1000"
            max="100000"
            step="1000"
            value={priceRange}
            onChange={(e) => setPriceRange(Number(e.target.value))}
          />
        </aside>

        {/* Product Grid Section */}
        <section className="product-section">
          {filteredProducts.length === 0 ? (
            <p className="no-products">No products found.</p>
          ) : (
            <div className="product-grid">
              {filteredProducts.map((product) => {
                const componentProps = {
                  email: user?.email,
                  amount: product.price * 100,
                  metadata: { name: user?.displayName, phone: "N/A" },
                  publicKey,
                  text: "Prepay Now",
                  onSuccess: (reference) => handlePrepay(product, reference),
                  onClose: () => toast.info("ℹ️ Payment cancelled."),
                };

                return (
                  <motion.div key={product.id} whileHover={{ scale: 1.05 }} className="product-card">
                    <img className="product-image" src={product.imageUrl || "https://via.placeholder.com/150"} alt={product.name} />
                    <h3 className="product-name">{product.name}</h3>
                    <p className="product-price">₦{product.price.toLocaleString()}</p>
                    <PaystackButton className="paystack-button" {...componentProps} />
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <ToastContainer />
    </div>
  );
};

export default Products;



// import React, { useEffect, useState } from "react";
// import { addDoc, collection, getDocs } from "firebase/firestore";
// import { db, auth } from "../firebase/firebaseConfig";
// import { onAuthStateChanged } from "firebase/auth";
// import { useNavigate } from "react-router-dom";
// import { PaystackButton } from "react-paystack";
// import { motion } from "framer-motion";
// import { toast, ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import "../styles/Products.css";

// const Products = () => {
//   const [products, setProducts] = useState([]);
//   const [filteredProducts, setFilteredProducts] = useState([]);
//   const [selectedCategory, setSelectedCategory] = useState("All");
//   const [priceRange, setPriceRange] = useState(100000);
//   const [user, setUser] = useState(null);
//   const navigate = useNavigate();

//   const publicKey = "pk_test_80cd454009d341493a2268547cf40ef0ad5a12c8";

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
//       if (currentUser) {
//         setUser(currentUser);
//       } else {
//         navigate("/login");
//       }
//     });

//     return () => unsubscribe(); // Cleanup
//   }, [navigate]);

//   useEffect(() => {
//     const fetchProducts = async () => {
//       try {
//         const productsSnapshot = await getDocs(collection(db, "products"));
//         const items = productsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
//         setProducts(items);
//         setFilteredProducts(items); // Initially set filteredProducts to all products
//       } catch (err) {
//         console.error("Error fetching products:", err.message);
//         toast.error("🚨 Failed to load products. Please try again later.");
//       }
//     };
//     fetchProducts();
//   }, []);

//   useEffect(() => {
//     const filtered = products.filter(
//       (product) =>
//         (selectedCategory === "All" || product.category === selectedCategory) &&
//         product.price <= priceRange
//     );
//     setFilteredProducts(filtered);
//   }, [selectedCategory, priceRange, products]);

//   const handlePrepay = async (product, reference) => {
//     if (!user || !product) return;

//     try {
//       const userWalletRef = collection(db, "users", user.uid, "wallet");
//       await addDoc(userWalletRef, {
//         productId: product.id,
//         productName: product.name,
//         productPrice: product.price,
//         imageUrl: product.imageUrl,
//         createdAt: new Date(),
//         paymentRef: reference.reference,
//       });

//       toast.success(` Payment successful! You have prepaid for ${product.name}`, {
//         position: "top-right",
//         autoClose: 5000,
//         hideProgressBar: false,
//         closeOnClick: true,
//         pauseOnHover: true,
//         draggable: true,
//         theme: "colored",
//       });
//     } catch (err) {
//       console.error("Error adding product to wallet:", err.message);
//       toast.error(" Failed to update wallet. Please contact support.", {
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
//     <div className="page-container">
//       <div className="sidebar">
//         <h3>Filters</h3>
//         <label className="sidebar-label">Category:</label>
//         <select
//           className="sidebar-select"
//           value={selectedCategory}
//           onChange={(e) => setSelectedCategory(e.target.value)}
//         >
//           <option value="All">All</option>
//           <option value="Grains">Grains</option>
//           <option value="Oils">Fat</option>
//           <option value="Vegetables">Fruits & Vegetables</option>
//           <option value="Dairy">Dairy</option>
//           <option value="Proteins">Proteins</option>
//           <option value="Hydrations">Hydrations</option>
//         </select>

//         <label className="sidebar-label">Max Price: ₦{priceRange.toLocaleString()}</label>
//         <input
//           type="range"
//           min="1000"
//           max="100000"
//           step="1000"
//           value={priceRange}
//           onChange={(e) => setPriceRange(Number(e.target.value))}
//         />
//       </div>

//       <div className="product-section">
//         <div className="header">
//           <h2>Products</h2>
//           <button className="wallet-button" onClick={() => navigate("/wallet")}>
//             Go to Wallet
//           </button>
//         </div>

//         {filteredProducts.length === 0 ? (
//           <p className="no-products">No products found.</p>
//         ) : (
//           <div className="product-grid">
//             {filteredProducts.map((product) => {
//               const componentProps = {
//                 email: user?.email,
//                 amount: product.price * 100,
//                 metadata: { name: user?.displayName, phone: "N/A" },
//                 publicKey,
//                 text: "Prepay Now",
//                 onSuccess: (reference) => handlePrepay(product, reference),
//                 onClose: () =>
//                   toast.info("ℹ️ Payment cancelled.", {
//                     position: "top-right",
//                     autoClose: 3000,
//                     hideProgressBar: false,
//                     closeOnClick: true,
//                     pauseOnHover: true,
//                     draggable: true,
//                     theme: "colored",
//                   }),
//               };

//               return (
//                 <motion.div key={product.id} whileHover={{ scale: 1.05 }}>
//                   <div className="product-card">
//                     <img
//                       className="product-image"
//                       src={product.imageUrl || "https://via.placeholder.com/150"}
//                       alt={product.name}
//                     />
//                     <h3 className="product-name">{product.name}</h3>
//                     <p className="product-price">₦{product.price.toLocaleString()}</p>
//                     <PaystackButton className="paystack-button" {...componentProps} />
//                   </div>
//                 </motion.div>
//               );
//             })}
//           </div>
//         )}
//       </div>

//       <ToastContainer />
//     </div>
//   );
// };

// export default Products;

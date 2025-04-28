import React, { useEffect, useState } from "react";
import { addDoc, collection, getDocs, doc, getDoc, setDoc, query, where, updateDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase/firebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { PaystackButton } from "react-paystack";
import { motion, AnimatePresence } from "framer-motion";
import "../styles/Products.css";
import CosmoCartLogo from "../assets/cosmocart-logo.png"; // Add your logo

const Products = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [priceRange, setPriceRange] = useState(100000);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [notification, setNotification] = useState(null);
  const navigate = useNavigate();

  const publicKey = "pk_test_80cd454009d341493a2268547cf40ef0ad5a12c8";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Check if user is admin
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setIsAdmin(userData.role === 'admin');
          }
        } catch (error) {
          console.error("Error checking admin status:", error);
        }
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
        alert("🚨 Failed to load products. Please try again later.");
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

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => {
      setNotification(null);
    }, 3000); // Auto-hide after 3 seconds
  };

  const handlePrepay = async (product, reference) => {
    if (!user || !product) {
      console.error("Missing user or product:", { user, product });
      return;
    }

    try {
      console.log("Starting prepayment process...");
      console.log("User:", user.uid);
      console.log("Product:", product);

      // Check if product already exists in wallet
      const walletRef = collection(db, "users", user.uid, "wallet");
      const q = query(walletRef, where("productId", "==", product.id));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Product exists, update quantity
        const existingDoc = querySnapshot.docs[0];
        const existingData = existingDoc.data();
        const currentQuantity = existingData.quantity || 1;
        
        await updateDoc(doc(db, "users", user.uid, "wallet", existingDoc.id), {
          quantity: currentQuantity + 1,
          updatedAt: serverTimestamp()
        });
        
        showNotification(`✅ Added another ${product.name} to your wallet`);
        // Add delay before navigation
        setTimeout(() => navigate("/wallet"), 1500);
      } else {
        // Product doesn't exist, create new document
        const walletData = {
          productId: product.id,
          productName: product.name,
          productPrice: product.price,
          imageUrl: product.imageUrl,
          createdAt: serverTimestamp(),
          paymentRef: reference.reference,
          status: 'active',
          userId: user.uid,
          email: user.email,
          quantity: 1
        };

        console.log("Attempting to add wallet document with data:", walletData);
        
        const walletDoc = await addDoc(walletRef, walletData);
        console.log("Wallet document added with ID:", walletDoc.id);

        // Verify the document was created
        const docRef = doc(db, "users", user.uid, "wallet", walletDoc.id);
        const docSnapshot = await getDoc(docRef);
        
        if (docSnapshot.exists()) {
          console.log("Document verified:", docSnapshot.data());
          showNotification(`✅ Payment successful! You have prepaid for ${product.name}`);
          // Add delay before navigation
          setTimeout(() => navigate("/wallet"), 1500);
        } else {
          console.error("Document verification failed - document does not exist");
          throw new Error("Wallet document was not created successfully");
        }
      }
    } catch (err) {
      console.error("Error in handlePrepay:", err);
      console.error("Error details:", {
        code: err.code,
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      showNotification("❌ Failed to update wallet. Please contact support.");
    }
  };

  const goToAdminDashboard = () => {
    navigate('/admin/dashboard');
  };

  return (
    <div className="page-container">
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="notification"
          >
            {notification}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Fixed Header Section */}
      <header className="header-container">
        <img className="logo" src={CosmoCartLogo} alt="CosmoCart Logo" />
        <div className="flex gap-4">
          {isAdmin && (
            <button
              onClick={goToAdminDashboard}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
            >
              Admin Dashboard
            </button>
          )}
          <button className="wallet-button" onClick={() => navigate("/wallet")}>
            Go to Wallet
          </button>
          <button 
            onClick={async () => {
              try {
                await signOut(auth);
                navigate("/");
              } catch (error) {
                console.error("Error logging out:", error);
                alert("Failed to log out");
              }
            }}
            className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
          >
            Logout
          </button>
        </div>
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
                  onClose: () => alert("ℹ️ Payment cancelled."),
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
    </div>
  );
};

export default Products;

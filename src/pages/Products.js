import React, { useEffect, useState, useRef } from "react";
import { addDoc, collection, getDocs, doc, getDoc, setDoc, query, where, updateDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase/firebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { PaystackButton } from "react-paystack";
import { motion, AnimatePresence } from "framer-motion";
import "../styles/Products.css";
import CosmoCartLogo from "../assets/cosmocart-logo.png"; // Add your logo
import { useCart } from '../context/CartContext'; // Import useCart hook
import Masonry from "react-masonry-css";
import { FaHome, FaSearch, FaThLarge, FaShoppingCart, FaWallet, FaUser, FaUserShield, FaStore, FaSignOutAlt } from "react-icons/fa";
import Sidebar from '../components/Sidebar';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [priceRange, setPriceRange] = useState(100000);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPartnerStore, setIsPartnerStore] = useState(false);
  const [notification, setNotification] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { cartItems, addToCart } = useCart(); // Consume cart context
  const [showSidebarSearch, setShowSidebarSearch] = useState(false);
  const [sidebarSearchValue, setSidebarSearchValue] = useState("");
  const sidebarSearchRef = useRef(null);
  const [showSidebarCategories, setShowSidebarCategories] = useState(false);
  const sidebarCategoriesRef = useRef(null);
  const categories = [
    "All",
    "Grains",
    "Fats",
    "Fruits & Vegetables",
    "Dairy",
    "Proteins",
    "Starchy Food",
    "Hydrations"
  ];

  const publicKey = "pk_test_80cd454009d341493a2268547cf40ef0ad5a12c8";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Check if user is admin or partner store
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setIsAdmin(userData.role === 'admin');
            setIsPartnerStore(userData.isPartnerStore === true);
          }
        } catch (error) {
          console.error("Error checking user status:", error);
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
        product.price <= priceRange &&
        (product.name?.toLowerCase().includes(searchQuery.toLowerCase()) || "")
    );
    setFilteredProducts(filtered);
  }, [selectedCategory, priceRange, products, searchQuery]);

  // Handle sidebar search open/close
  useEffect(() => {
    if (!showSidebarSearch) return;
    function handleClickOutside(e) {
      if (sidebarSearchRef.current && !sidebarSearchRef.current.contains(e.target)) {
        setShowSidebarSearch(false);
      }
    }
    function handleEsc(e) {
      if (e.key === "Escape") setShowSidebarSearch(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [showSidebarSearch]);

  // When sidebar search is submitted, update main searchQuery
  function handleSidebarSearchSubmit(e) {
    e.preventDefault();
    setSearchQuery(sidebarSearchValue);
    setShowSidebarSearch(false);
  }

  // Handle sidebar categories open/close
  useEffect(() => {
    if (!showSidebarCategories) return;
    function handleClickOutside(e) {
      if (sidebarCategoriesRef.current && !sidebarCategoriesRef.current.contains(e.target)) {
        setShowSidebarCategories(false);
      }
    }
    function handleEsc(e) {
      if (e.key === "Escape") setShowSidebarCategories(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [showSidebarCategories]);

  function handleSidebarCategorySelect(cat) {
    setSelectedCategory(cat);
    setShowSidebarCategories(false);
  }

  const showNotification = (message) => {
    console.log("Showing notification:", message);
    setNotification(message);
    setTimeout(() => {
      setNotification(null);
    }, 3000); // Auto-hide after 3 seconds
  };

  const handlePartnerStoreClick = () => {
    if (isPartnerStore) {
      navigate("/partner/dashboard");
    } else {
      showNotification("You are not registered as a partner store. Please contact support to register.");
    }
  };

  const goToAdminDashboard = () => {
    navigate('/admin/dashboard');
  };

  // Calculate total quantity of items in cart
  const totalCartQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="page-container">
      <AnimatePresence>
        {notification && (
          <motion.div
            key={notification}
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="notification"
          >
            {notification}
          </motion.div>
        )}
      </AnimatePresence>
      {/* Shared Sidebar Navigation */}
      <Sidebar
        isAdmin={isAdmin}
        isPartnerStore={isPartnerStore}
        goToAdminDashboard={goToAdminDashboard}
        handlePartnerStoreClick={handlePartnerStoreClick}
      />

      {/* Main Content Layout */}
      <div className="main-content">
        {/* Product Grid Section */}
        <section className="product-section">
          {filteredProducts.length === 0 ? (
            <p className="no-products">No products found.</p>
          ) : (
            <Masonry
              breakpointCols={{ default: 4, 1100: 3, 700: 2, 435: 2, 0: 1 }}
              className="my-masonry-grid"
              columnClassName="my-masonry-grid_column"
            >
              {filteredProducts.map((product) => {
                const isInCart = cartItems.some(item => item.id === product.id);
                return (
                  <motion.div
                    key={product.id}
                    whileHover={{ scale: 1.05 }}
                    className={`product-card ${isInCart ? 'in-cart' : ''}`}
                    onClick={() => {
                      addToCart(product);
                      showNotification(`Added ${product.name} to cart.`);
                    }}
                    id={`product-${product.id}`}
                  >
                    <div className="product-image-container">
                    <img
                      className="product-image"
                      src={product.imageUrl || "https://via.placeholder.com/150"}
                      alt={product.name}
                    />
                      <div className="product-overlay">
                        <div className="product-name">{product.name}</div>
                        <div className="product-price">₦{product.price.toLocaleString()}</div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </Masonry>
          )}
        </section>
      </div>
    </div>
  );
};

export default Products;

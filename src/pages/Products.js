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
import { useSubscription } from '../contexts/SubscriptionContext';
import Masonry from "react-masonry-css";
import { FaHome, FaSearch, FaThLarge, FaShoppingCart, FaWallet, FaUser, FaUserShield, FaStore, FaSignOutAlt, FaChevronDown } from "react-icons/fa";
import Sidebar from '../components/Sidebar';
import SubscriptionPlans from '../components/SubscriptionPlans';

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
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { cartItems, addToCart } = useCart(); // Consume cart context
  const { getSubscriptionInfo } = useSubscription();
  const [showSidebarSearch, setShowSidebarSearch] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
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
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef(null);

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
          } else {
             setIsAdmin(false);
             setIsPartnerStore(false);
          }
        } catch (error) {
          console.error("Error checking user status:", error);
          setIsAdmin(false);
          setIsPartnerStore(false);
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
        console.log('Fetched products:', items);
        console.log('Product categories:', [...new Set(items.map(p => p.category))]);
        setProducts(items);
        setFilteredProducts(items);
      } catch (err) {
        console.error("Error fetching products:", err.message);
        alert("🚨 Failed to load products. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    console.log('Filtering products - Category:', selectedCategory, 'Products count:', products.length);
    const filtered = products.filter(
      (product) =>
        (selectedCategory === "All" || product.category === selectedCategory) &&
        product.price <= priceRange &&
        (product.name?.toLowerCase().includes(searchQuery.toLowerCase()) || "")
    );
    console.log('Filtered products count:', filtered.length);
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
    console.log('Category selected:', cat);
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
        onCategorySelect={handleSidebarCategorySelect}
        selectedCategory={selectedCategory}
        onSearchSubmit={(value) => setSearchQuery(value)}
      />

      {/* Header Section */}
      <div className="header-container">
        <img src={CosmoCartLogo} alt="CosmoCart" className="header-logo" />
        {user && (
          <div className="header-profile" tabIndex={0} onBlur={() => setProfileDropdownOpen(false)}>
            <div className="header-profile-main" onClick={() => setProfileDropdownOpen(v => !v)}>
              <span className="header-profile-avatar">
                {(user.displayName ? user.displayName[0] : user.email[0]).toUpperCase()}
              </span>
              <span className="header-profile-name desktop-only">
                {user.displayName || user.email}
              </span>
              <span className="header-profile-arrow">
                <FaChevronDown style={{ fontSize: '1em' }} />
              </span>
            </div>
            <div className={`header-profile-dropdown${profileDropdownOpen ? ' open' : ''}`}>
              <span className="header-profile-name mobile-only">
                {user.displayName || user.email}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Layout */}
      <div className="main-content">
        {/* Product Grid Section */}
        <section className="product-section">
          {loading ? (
             <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>Loading reserve options...</div>
          ) : filteredProducts.length === 0 ? (
            <p className="no-products">No items match your search. Try broadening your reserve options. You're covered.</p>
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
                    onClick={() => navigate(`/products/${product.id}`)}
                    id={`product-${product.id}`}
                  >
                    <div className="product-image-container">
                      <img
                        className="product-image"
                        src={product.imageUrl || "https://via.placeholder.com/150"}
                        alt={product.name}
                      />
                      <div className="product-overlay">
                        <button
                          className="add-to-cart-overlay-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            try {
                              const subscriptionInfo = getSubscriptionInfo();
                              addToCart(product, subscriptionInfo);
                              showNotification(`Secured ${product.name} for later.`);
                            } catch (error) {
                              if (error.message === 'WALLET_LIMIT_EXCEEDED') {
                                setShowSubscriptionModal(true);
                                showNotification("❌ Wallet limit exceeded. Please subscribe to secure more items.");
                              } else {
                                showNotification("❌ Failed to secure item. Please try again.");
                              }
                            }
                          }}
                        >
                          {isInCart ? '✓ Secured' : 'Secure This Item'}
                        </button>
                      </div>
                    </div>
                    
                    <div className="product-details">
                      <div className="product-info">
                        <div className="product-name" title={product.name}>
                          {product.name}
                        </div>
                        <div className="product-price">
                          ₦{product.price.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </Masonry>
          )}
        </section>
      </div>

      {/* Subscription Modal */}
      {showSubscriptionModal && (
        <SubscriptionPlans 
          onClose={() => setShowSubscriptionModal(false)}
          showUpgradePrompt={true}
        />
      )}
    </div>
  );
};

export default Products;

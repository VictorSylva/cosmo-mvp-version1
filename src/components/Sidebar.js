import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from '../context/CartContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import CosmoCartLogo from "../assets/cosmocart-logo.png";
import { FaSearch, FaThLarge, FaShoppingCart, FaWallet, FaUser, FaUserShield, FaStore, FaSignOutAlt, FaBars, FaChevronLeft, FaCrown } from "react-icons/fa";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";
import SubscriptionPlans from './SubscriptionPlans';
import "../styles/Products.css";

const Sidebar = ({ isAdmin, isPartnerStore, goToAdminDashboard, handlePartnerStoreClick, onSearchSubmit, onCategorySelect, selectedCategory }) => {
  const navigate = useNavigate();
  const { cartItems } = useCart();
  const { getSubscriptionInfo } = useSubscription();
  console.log('Sidebar cartItems:', cartItems); // DEBUG
  const [showSidebarSearch, setShowSidebarSearch] = useState(false);
  const [sidebarSearchValue, setSidebarSearchValue] = useState("");
  const sidebarSearchRef = useRef(null);
  const [showSidebarCategories, setShowSidebarCategories] = useState(false);
  const sidebarCategoriesRef = useRef(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Calculate total quantity of items in cart
  const totalCartQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Handle sidebar search open/close
  React.useEffect(() => {
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

  // Handle sidebar categories open/close
  React.useEffect(() => {
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
    if (onCategorySelect) {
      onCategorySelect(cat);
    }
    setShowSidebarCategories(false);
  }

  function handleSidebarSearchSubmit(e) {
    e.preventDefault();
    if (onSearchSubmit) {
      onSearchSubmit(sidebarSearchValue);
    }
    setShowSidebarSearch(false);
  }

  return (
    <nav className={`pinterest-sidebar${mobileSidebarOpen ? ' mobile-expanded' : ''}`}>
      <div className="sidebar-logo-row">
        {/* Mobile toggle button */}
        <button
          className="sidebar-mobile-toggle"
          aria-label={mobileSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          onClick={() => setMobileSidebarOpen((open) => !open)}
        >
          {mobileSidebarOpen ? <FaChevronLeft /> : <FaBars />}
        </button>
      </div>
      <div className="sidebar-icons">
        <button aria-label="Search" onClick={() => setShowSidebarSearch(true)}> <FaSearch /> <span className="sidebar-tooltip">Find Food</span> <span className="sidebar-label">Find Food</span> </button>
        <button aria-label="Categories" onClick={() => setShowSidebarCategories(true)}> <FaThLarge /> <span className="sidebar-tooltip">Food Types</span> <span className="sidebar-label">Food Types</span> </button>
        {isAdmin === true && (
          <button aria-label="Admin Dashboard" onClick={goToAdminDashboard}> <FaUserShield /> <span className="sidebar-tooltip">Admin</span> <span className="sidebar-label">Admin</span> </button>
        )}
        {isPartnerStore === true && (
          <button aria-label="Partner Store Dashboard" onClick={handlePartnerStoreClick}> <FaStore /> <span className="sidebar-tooltip">Store</span> <span className="sidebar-label">Store</span> </button>
        )}
          <button aria-label="Cart" onClick={() => navigate("/cart")}> 
            <div style={{ position: 'relative', display: 'flex' }}>
              <FaShoppingCart />
              {totalCartQuantity > 0 && (
                <span className="cart-badge">{totalCartQuantity}</span>
              )}
            </div>
            <span className="sidebar-tooltip">Reserve</span>
            <span className="sidebar-label">Reserve</span>
          </button>
        <button aria-label="Wallet" onClick={() => navigate("/wallet")}> <FaWallet /> <span className="sidebar-tooltip">My Food</span> <span className="sidebar-label">My Food</span> </button>
        <button 
          aria-label="Subscription" 
          onClick={() => setShowSubscriptionModal(true)}
          className={`subscription-button ${getSubscriptionInfo()?.isActive ? 'active' : ''}`}
        > 
          <FaCrown /> 
          <span className="sidebar-tooltip">
            {getSubscriptionInfo()?.isActive ? 'Manage Subscription' : 'Upgrade Plan'}
          </span> 
          <span className="sidebar-label">
            {getSubscriptionInfo()?.isActive ? 'Premium' : 'Upgrade'}
          </span> 
        </button>
        <button aria-label="Logout" onClick={async () => { await signOut(auth); navigate("/"); }}> <FaSignOutAlt style={{ color: 'red' }} /> <span className="sidebar-tooltip">Logout</span> <span className="sidebar-label">Logout</span> </button>
      </div>
      {showSidebarSearch && (
        <div className="sidebar-search-float" ref={sidebarSearchRef}>
          <input
            autoFocus
            type="text"
            placeholder="Search products..."
            value={sidebarSearchValue}
            onChange={e => {
              setSidebarSearchValue(e.target.value);
              if (onSearchSubmit) {
                onSearchSubmit(e.target.value);
              }
            }}
          />
        </div>
      )}
      {showSidebarCategories && (
        <div className="sidebar-categories-float" ref={sidebarCategoriesRef}>
          {categories.map(cat => (
            <button
              key={cat}
              className={cat === selectedCategory ? "active" : ""}
              onClick={() => handleSidebarCategorySelect(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Subscription Modal */}
      {showSubscriptionModal && (
        <SubscriptionPlans 
          onClose={() => setShowSubscriptionModal(false)}
          showUpgradePrompt={false}
        />
      )}
      <div className="sidebar-footer" style={{ textAlign: 'center', padding: '10px', fontSize: '0.8rem', color: '#888', marginTop: 'auto' }}>
        <small>Small steps. Big security.</small>
      </div>
    </nav>
  );
};

export default Sidebar; 
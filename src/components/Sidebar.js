import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from '../context/CartContext';
import CosmoCartLogo from "../assets/cosmocart-logo.png";
import { FaHome, FaSearch, FaThLarge, FaShoppingCart, FaWallet, FaUser, FaUserShield, FaStore, FaSignOutAlt } from "react-icons/fa";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";
import "../styles/Products.css";

const Sidebar = ({ isAdmin, isPartnerStore, goToAdminDashboard, handlePartnerStoreClick, onSearchClick, onCategorySelect, selectedCategory }) => {
  const navigate = useNavigate();
  const { cartItems } = useCart();
  console.log('Sidebar cartItems:', cartItems); // DEBUG
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
    // This should be handled by parent if needed
    setShowSidebarSearch(false);
  }

  return (
    <nav className="pinterest-sidebar">
      <div className="sidebar-logo-row">
      <div className="sidebar-logo" onClick={() => navigate("/")}> 
        <img src={CosmoCartLogo} alt="Logo" />
        </div>
        {/* Search icon removed from sidebar */}
      </div>
      <div className="sidebar-icons">
        <button aria-label="Home" onClick={() => navigate("/")}> <FaHome /> <span className="sidebar-tooltip">Home</span> </button>
        <button aria-label="Categories" onClick={() => setShowSidebarCategories(true)}> <FaThLarge /> <span className="sidebar-tooltip">Categories</span> </button>
        <button aria-label="Admin Dashboard" disabled={!isAdmin} style={{opacity: isAdmin ? 1 : 0.7, pointerEvents: isAdmin ? 'auto' : 'none'}} onClick={goToAdminDashboard}> <FaUserShield /> <span className="sidebar-tooltip">Admin</span> </button>
        <button aria-label="Partner Store Dashboard" disabled={!isPartnerStore} style={{opacity: isPartnerStore ? 1 : 0.7, pointerEvents: isPartnerStore ? 'auto' : 'none'}} onClick={handlePartnerStoreClick}> <FaStore /> <span className="sidebar-tooltip">Store</span> </button>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button aria-label="Cart" onClick={() => navigate("/cart")}> 
            <FaShoppingCart />
            <span className="sidebar-tooltip">Cart</span>
          </button>
          {totalCartQuantity > 0 && (
            <span className="cart-badge" style={{ marginLeft: 8 }}>{totalCartQuantity}</span>
          )}
        </div>
        <button aria-label="Wallet" onClick={() => navigate("/wallet")}> <FaWallet /> <span className="sidebar-tooltip">Wallet</span> </button>
        <button aria-label="Logout" onClick={async () => { await signOut(auth); navigate("/"); }}> <FaSignOutAlt /> <span className="sidebar-tooltip">Logout</span> </button>
      </div>
      {showSidebarSearch && (
        <form className="sidebar-search-float" ref={sidebarSearchRef} onSubmit={handleSidebarSearchSubmit}>
          <input
            autoFocus
            type="text"
            placeholder="Search products..."
            value={sidebarSearchValue}
            onChange={e => setSidebarSearchValue(e.target.value)}
          />
        </form>
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
    </nav>
  );
};

export default Sidebar; 
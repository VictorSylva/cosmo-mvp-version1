import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { useCart } from '../context/CartContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { motion, AnimatePresence } from "framer-motion";
import "../styles/ProductDetails.css";
import CosmoCartLogo from "../assets/cosmocart-logo.png";
import { FaArrowLeft, FaShoppingCart } from "react-icons/fa";
import SubscriptionPlans from '../components/SubscriptionPlans';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const { cartItems, addToCart } = useCart();
  const { getSubscriptionInfo } = useSubscription();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const productDoc = await getDoc(doc(db, "products", id));
        if (productDoc.exists()) {
          setProduct({ id: productDoc.id, ...productDoc.data() });
        } else {
          setNotification("Product not found");
          setTimeout(() => navigate("/products"), 2000);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        setNotification("Error loading product");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, navigate]);

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const handleAddToCart = () => {
    try {
      const subscriptionInfo = getSubscriptionInfo();
      addToCart(product, subscriptionInfo);
      showNotification(`Added ${product.name} to cart.`);
    } catch (error) {
      if (error.message === 'WALLET_LIMIT_EXCEEDED') {
        setShowSubscriptionModal(true);
        showNotification("❌ Wallet limit exceeded. Please subscribe to add more items.");
      } else {
        showNotification("❌ Failed to add item to cart. Please try again.");
      }
    }
  };

  const isInCart = cartItems.some(item => item.id === id);

  if (loading) {
    return (
      <div className="product-details-loading">
        <div className="loading-spinner"></div>
        <p>Loading product...</p>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="product-details-container">
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

      {/* Header */}
      <div className="product-details-header">
        <button className="back-button" onClick={() => navigate("/products")}>
          <FaArrowLeft /> Back to Products
        </button>
        <img src={CosmoCartLogo} alt="CosmoCart" className="header-logo" />
      </div>

      {/* Main Content */}
      <div className="product-details-content">
        <div className="product-details-image-section">
          <img
            src={product.imageUrl || "https://via.placeholder.com/500"}
            alt={product.name}
            className="product-details-image"
          />
        </div>

        <div className="product-details-info-section">
          <h1 className="product-details-title">{product.name}</h1>
          
          <div className="product-details-price">
            <span className="price-label">Price:</span>
            <span className="price-value">₦{product.price.toLocaleString()}</span>
          </div>

          {product.category && (
            <div className="product-details-category">
              <span className="category-label">Category:</span>
              <span className="category-badge">{product.category}</span>
            </div>
          )}

          {product.description && (
            <div className="product-details-description">
              <h3>Description</h3>
              <p>{product.description}</p>
            </div>
          )}

          <div className="product-details-actions">
            <button
              className={`add-to-cart-button ${isInCart ? 'in-cart' : ''}`}
              onClick={handleAddToCart}
            >
              <FaShoppingCart />
              {isInCart ? 'Added to Cart' : 'Add to Cart'}
            </button>
            
            <button
              className="view-cart-button"
              onClick={() => navigate("/cart")}
            >
              View Cart ({cartItems.length})
            </button>
          </div>

          {isInCart && (
            <div className="already-in-cart-notice">
              ✓ This item is already in your cart
            </div>
          )}
        </div>
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

export default ProductDetails;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { PaystackButton } from "react-paystack";
import { motion, AnimatePresence } from "framer-motion";
import SubscriptionPlans from '../components/SubscriptionPlans';
import "../styles/Cart.css"; // We will create this CSS file next
import CosmoCartLogo from "../assets/cosmocart-logo.png";

const Cart = () => {
  const navigate = useNavigate();
  const { cartItems, removeFromCart, updateQuantity, calculateCartTotal, handleBulkPrepay, user, loadingUser, walletItemCount } = useCart();
  const { getSubscriptionInfo, subscription, loading: subscriptionLoading } = useSubscription();
  const [notification, setNotification] = useState(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const publicKey = "pk_test_80cd454009d341493a2268547cf40ef0ad5a12c8"; // Get from environment variables in a real app

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // Redirect to login if user is not authenticated and not loading
  React.useEffect(() => {
    if (!user && !loadingUser) {
      navigate('/login');
    }
  }, [user, loadingUser, navigate]);

  if (loadingUser || subscriptionLoading) {
    return <div>Loading...</div>; // Or a loading spinner
  }

  if (!user) {
    return null; // Should redirect to login via useEffect
  }

  return (
    <div className="cart-page-container">
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

      <header className="cart-header-container">
        <img className="cart-logo" src={CosmoCartLogo} alt="CosmoCart Logo" />
      </header>

      <div className="cart-content">
        <h2>Your Food Reserve</h2>
        
        <div className="cart-page-actions">
           <button className="back-button" onClick={() => navigate("/products")}>
            Secure Food
          </button>
          <button className="wallet-button" onClick={() => navigate("/wallet")}>
            My Wallet
          </button>
        </div>
        {cartItems.length === 0 ? (
          <p>Your reserve is empty. A little planning goes a long way. Go to the <span onClick={() => navigate('/products')} className="products-link">products page</span> to secure items.</p>
        ) : (
          <div className="cart-items-list">
            {cartItems.map(item => (
              <div key={item.id} className="cart-item">
                <img src={item.imageUrl || "https://via.placeholder.com/100"} alt={item.name} className="cart-item-image" />
                <div className="cart-item-details">
                  <h3>{item.name}</h3>
                  <p>Price: ₦{item.price.toLocaleString()}</p>
                  <div className="quantity-controls">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="remove-item-button">Remove</button>
                </div>
                <div className="cart-item-total">
                  ₦{(item.price * item.quantity).toLocaleString()}
                </div>
              </div>
            ))}
            <div className="cart-summary">
              <h3>Reserve Summary</h3>
              <p>Total Items: {cartItems.reduce((total, item) => total + item.quantity, 0)}</p>
              <p className="cart-total">Total: ₦{calculateCartTotal().toLocaleString()}</p>
              <p className="price-lock-text">🔒 Your price is locked in.</p>
              
              {(() => {
                const subscriptionInfo = getSubscriptionInfo();
                const totalNewItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
                const newTotalItems = walletItemCount + totalNewItems;
                
                
                // If user has free plan and would exceed 1 item limit, show subscription modal instead
                // Also check if subscription is not active (fallback to subscription object)
                const isSubscriptionActive = subscriptionInfo?.isActive || subscription?.isActive;
                if (!isSubscriptionActive && (walletItemCount >= 1 || newTotalItems > 1)) {
                  return (
                    <button
                      className="paystack-button subscription-redirect"
                      onClick={() => setShowSubscriptionModal(true)}
                    >
                      Subscribe to Continue
                    </button>
                  );
                }
                
                return (
                  <PaystackButton
                    className="paystack-button"
                    email={user?.email}
                    amount={calculateCartTotal() * 100}
                    metadata={{ name: user?.displayName, phone: "N/A" }}
                    publicKey={publicKey}
                    text="Complete Reservation"
                    onSuccess={async (reference) => {
                      try {
                        await handleBulkPrepay(reference, subscriptionInfo);
                        showNotification(`✅ Your food is safe! Secured ${cartItems.reduce((total, item) => total + item.quantity, 0)} items for the future.`);
                        navigate("/wallet");
                      } catch (error) {
                        if (error.message === 'WALLET_LIMIT_EXCEEDED') {
                          setShowSubscriptionModal(true);
                          showNotification("❌ Wallet limit exceeded. Please subscribe to store more items.");
                        } else {
                          showNotification("❌ We couldn't secure your items. Please try again.");
                        }
                      }
                    }}
                    onClose={() => showNotification("ℹ️ Reservation cancelled.")}
                  />
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Subscription Modal */}
      {showSubscriptionModal && (
        <SubscriptionPlans 
          onClose={() => setShowSubscriptionModal(false)}
          showUpgradePrompt={true}
        />
      )}

      {/* Wallet Limit Warning */}
      {cartItems.length > 0 && (
        <div className="wallet-limit-warning">
          <div className="warning-content">
            <p>
              <strong>Wallet Status:</strong> {walletItemCount} items currently stored
              {(() => {
                const subscriptionInfo = getSubscriptionInfo();
                const isSubscriptionActive = subscriptionInfo?.isActive || subscription?.isActive;
                return !isSubscriptionActive;
              })() && (
                <span className="limit-text"> (Free plan: 1 item limit)</span>
              )}
            </p>
            {(() => {
              const subscriptionInfo = getSubscriptionInfo();
              const isSubscriptionActive = subscriptionInfo?.isActive || subscription?.isActive;
              return !isSubscriptionActive && (walletItemCount >= 1 || cartItems.length > 0);
            })() && (
              <button 
                className="upgrade-button"
                onClick={() => setShowSubscriptionModal(true)}
              >
                Upgrade to Unlimited Storage
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart; 
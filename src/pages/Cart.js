import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { PaystackButton } from "react-paystack";
import { motion, AnimatePresence } from "framer-motion";
import "../styles/Cart.css"; // We will create this CSS file next
import CosmoCartLogo from "../assets/cosmocart-logo.png";

const Cart = () => {
  const navigate = useNavigate();
  const { cartItems, removeFromCart, updateQuantity, calculateCartTotal, handleBulkPrepay, user, loadingUser } = useCart();
  const [notification, setNotification] = React.useState(null); // Local notification for cart page

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

  if (loadingUser) {
    return <div>Loading user...</div>; // Or a loading spinner
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
        <div className="cart-header-buttons">
           <button className="back-button" onClick={() => navigate("/products")}>
            Back to Products
          </button>
          <button className="wallet-button" onClick={() => navigate("/wallet")}>
            Go to Wallet
          </button>
        </div>
      </header>

      <div className="cart-content">
        <h2>Your Cart</h2>
        {cartItems.length === 0 ? (
          <p>Your cart is empty. Go to the <span onClick={() => navigate('/products')} className="products-link">products page</span> to add items.</p>
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
              <h3>Order Summary</h3>
              <p>Total Items: {cartItems.reduce((total, item) => total + item.quantity, 0)}</p>
              <p className="cart-total">Total: ₦{calculateCartTotal().toLocaleString()}</p>
              
              <PaystackButton
                className="paystack-button"
                email={user?.email}
                amount={calculateCartTotal() * 100}
                metadata={{ name: user?.displayName, phone: "N/A" }}
                publicKey={publicKey}
                text="Prepay Now"
                onSuccess={(reference) => { // Use a wrapper function to show notification and navigate
                  handleBulkPrepay(reference);
                  showNotification(`✅ Payment successful! Prepaid for ${cartItems.reduce((total, item) => total + item.quantity, 0)} items.`);
                  navigate("/wallet");
                }}
                onClose={() => showNotification("ℹ️ Payment cancelled.")}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart; 
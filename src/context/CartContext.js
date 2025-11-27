import React, { createContext, useContext, useState, useEffect } from 'react';
import { addDoc, collection, getDocs, doc, getDoc, setDoc, query, where, updateDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const stored = localStorage.getItem('cartItems');
    return stored ? JSON.parse(stored) : [];
  });
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [walletItemCount, setWalletItemCount] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingUser(false);
      if (currentUser) {
        fetchWalletItemCount(currentUser.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchWalletItemCount = async (userId) => {
    try {
      const walletRef = collection(db, "users", userId, "wallet");
      const walletSnapshot = await getDocs(walletRef);
      let totalItems = 0;
      
      walletSnapshot.docs.forEach(doc => {
        const data = doc.data();
        totalItems += data.quantity || 1;
      });
      
      setWalletItemCount(totalItems);
    } catch (error) {
      console.error("Error fetching wallet item count:", error);
      setWalletItemCount(0);
    }
  };

  // Persist cartItems to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, subscriptionInfo) => {
    // Check if user can add more items based on subscription
    const currentCartItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const newTotalItems = walletItemCount + currentCartItems + 1; // +1 for the new item
    
    // If user has free plan and would exceed 1 item limit OR already has 1 item
    if (!subscriptionInfo?.isActive && (walletItemCount >= 1 || newTotalItems > 1)) {
      throw new Error('WALLET_LIMIT_EXCEEDED');
    }

    setCartItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(item => item.id === product.id);
      if (existingItemIndex > -1) {
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex].quantity += 1;
        return updatedItems;
      } else {
        return [...prevItems, { ...product, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (productId) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    setCartItems(prevItems => {
      const updatedItems = prevItems.map(item =>
        item.id === productId ? { ...item, quantity: quantity } : item
      ).filter(item => item.quantity > 0); // Remove item if quantity is 0 or less
      return updatedItems;
    });
  };

  const calculateCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleBulkPrepay = async (reference, subscriptionInfo) => {
    if (!user || cartItems.length === 0) {
      console.error("User not logged in or cart is empty.");
      return;
    }

    // Check subscription limits
    const totalNewItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const newTotalItems = walletItemCount + totalNewItems;
    
    // If user has free plan and would exceed 1 item limit OR already has 1 item
    if (!subscriptionInfo?.isActive && (walletItemCount >= 1 || newTotalItems > 1)) {
      throw new Error('WALLET_LIMIT_EXCEEDED');
    }

    try {
      const userWalletRef = collection(db, "users", user.uid, "wallet");
      
      for (const item of cartItems) {
        const walletData = {
          productId: item.id,
          productName: item.name,
          productPrice: item.price,
          imageUrl: item.imageUrl,
          createdAt: serverTimestamp(),
          paymentRef: reference.reference,
          status: 'active',
          userId: user.uid,
          email: user.email,
          quantity: item.quantity,
        };

        await addDoc(userWalletRef, walletData);
      }

      // Update wallet item count
      setWalletItemCount(prev => prev + totalNewItems);
      
      // Clear the cart after successful payment
      setCartItems([]);
      
      return { success: true };

    } catch (err) {
      console.error("Error in bulk prepayment:", err);
      throw err;
    }
  };

  return (
    <CartContext.Provider value={{ 
      cartItems, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      calculateCartTotal, 
      handleBulkPrepay, 
      user, 
      loadingUser,
      walletItemCount,
      fetchWalletItemCount
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext); 
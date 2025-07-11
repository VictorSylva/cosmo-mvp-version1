import React, { createContext, useContext, useState, useEffect } from 'react';
import { addDoc, collection, getDocs, doc, getDoc, setDoc, query, where, updateDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingUser(false);
    });
    return () => unsubscribe();
  }, []);

  const addToCart = (product) => {
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

  const handleBulkPrepay = async (reference) => {
    if (!user || cartItems.length === 0) {
      console.error("User not logged in or cart is empty.");
      // Optionally show a notification
      return;
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

      // Clear the cart after successful payment
      setCartItems([]);
      // Optionally show a success notification

    } catch (err) {
      console.error("Error in bulk prepayment:", err);
      // Optionally show an error notification
    }
  };

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, calculateCartTotal, handleBulkPrepay, user, loadingUser }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext); 
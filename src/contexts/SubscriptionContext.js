import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

const SubscriptionContext = createContext();

export const SubscriptionProvider = ({ children }) => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchSubscription(currentUser.uid);
      } else {
        setSubscription(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchSubscription = async (userId) => {
    try {
      setLoading(true);
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setSubscription({
          plan: userData.subscription?.plan || 'free',
          status: userData.subscription?.status || 'active',
          startDate: userData.subscription?.startDate || null,
          endDate: userData.subscription?.endDate || null,
          isActive: userData.subscription?.isActive || false,
          maxItems: userData.subscription?.maxItems || 1
        });
      } else {
        setSubscription({
          plan: 'free',
          status: 'active',
          startDate: null,
          endDate: null,
          isActive: false,
          maxItems: 1
        });
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setSubscription({
        plan: 'free',
        status: 'active',
        startDate: null,
        endDate: null,
        isActive: false,
        maxItems: 1
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSubscription = async (subscriptionData) => {
    if (!user) return;
    
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        subscription: {
          ...subscriptionData,
          updatedAt: serverTimestamp()
        }
      });
      
      setSubscription(prev => ({
        ...prev,
        ...subscriptionData
      }));
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  };

  const subscribeToPlan = async (planType, paymentReference) => {
    if (!user) return;
    
    const plans = {
      'monthly': {
        plan: 'monthly',
        duration: 30, // days
        price: 3000,
        maxItems: -1 // unlimited
      },
      'six_months': {
        plan: 'six_months',
        duration: 180, // days
        price: 6000,
        maxItems: -1 // unlimited
      },
      'yearly': {
        plan: 'yearly',
        duration: 365, // days
        price: 10000,
        maxItems: -1 // unlimited
      }
    };

    const selectedPlan = plans[planType];
    if (!selectedPlan) throw new Error('Invalid plan type');

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + selectedPlan.duration);

    const subscriptionData = {
      plan: selectedPlan.plan,
      status: 'active',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      isActive: true,
      maxItems: selectedPlan.maxItems,
      price: selectedPlan.price,
      paymentReference: paymentReference,
      createdAt: serverTimestamp()
    };

    await updateSubscription(subscriptionData);
    return subscriptionData;
  };

  const checkSubscriptionStatus = () => {
    if (!subscription) return false;
    
    if (subscription.plan === 'free') return false; // Free users don't have active subscription
    
    if (subscription.endDate) {
      const now = new Date();
      const endDate = new Date(subscription.endDate);
      return now < endDate && subscription.isActive;
    }
    
    return false;
  };

  const canAddToWallet = (currentItemCount) => {
    if (!subscription) return false;
    
    if (subscription.maxItems === -1) return true; // unlimited
    return currentItemCount < subscription.maxItems;
  };

  const getSubscriptionInfo = () => {
    if (!subscription) return null;
    
    return {
      plan: subscription.plan,
      isActive: checkSubscriptionStatus(),
      maxItems: subscription.maxItems,
      endDate: subscription.endDate,
      daysRemaining: subscription.endDate ? 
        Math.ceil((new Date(subscription.endDate) - new Date()) / (1000 * 60 * 60 * 24)) : 0
    };
  };

  const value = {
    subscription,
    loading,
    updateSubscription,
    subscribeToPlan,
    checkSubscriptionStatus,
    canAddToWallet,
    getSubscriptionInfo
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

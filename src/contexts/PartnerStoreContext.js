import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

const PartnerStoreContext = createContext();

export const usePartnerStore = () => {
  const context = useContext(PartnerStoreContext);
  if (!context) {
    throw new Error('usePartnerStore must be used within a PartnerStoreProvider');
  }
  return context;
};

export const PartnerStoreProvider = ({ children }) => {
  const [partnerData, setPartnerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      try {
        if (user) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.data();
          
          if (userData?.isPartnerStore) {
            setPartnerData({
              id: user.uid,
              storeName: userData.storeName,
              email: userData.email,
              address: userData.address,
              phone: userData.phone,
              contactPerson: userData.contactPerson
            });
          } else {
            setPartnerData(null);
          }
        } else {
          setPartnerData(null);
        }
      } catch (err) {
        console.error('Error fetching partner data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const value = {
    partnerData,
    loading,
    error
  };

  return (
    <PartnerStoreContext.Provider value={value}>
      {children}
    </PartnerStoreContext.Provider>
  );
};

export default PartnerStoreContext; 
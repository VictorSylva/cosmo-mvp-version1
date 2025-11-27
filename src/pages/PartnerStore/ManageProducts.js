import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc, setDoc, query, where } from 'firebase/firestore';
import { db, auth } from '../../firebase/firebaseConfig';
import { usePartnerStore } from '../../contexts/PartnerStoreContext';
import PartnerLayout from '../../components/PartnerDashboard/PartnerLayout';
import '../../styles/PartnerStoreDashboard.css';

const ManageProducts = () => {
  const { partnerData } = usePartnerStore();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newPrices, setNewPrices] = useState({});
  const [successMessages, setSuccessMessages] = useState({});

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Fetch all products
        const productsSnapshot = await getDocs(collection(db, 'products'));
        const productsData = productsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Fetch partner prices using a query
        const priceQuery = query(
          collection(db, 'partner_store_prices'),
          where('partnerID', '==', partnerData.id)
        );
        const priceSnapshot = await getDocs(priceQuery);
        
        // Create a map of productId -> price
        const priceData = priceSnapshot.docs.reduce((acc, doc) => {
          const data = doc.data();
          acc[data.productId] = data.price;
          return acc;
        }, {});

        // Combine products with partner prices
        const updatedProducts = productsData.map((product) => ({
          ...product,
          partnerPrice: priceData[product.id] ?? product.price,
        }));

        setProducts(updatedProducts);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (partnerData) {
      fetchProducts();
    }
  }, [partnerData]);

  const handlePriceInputChange = (productId, value) => {
    setNewPrices({ ...newPrices, [productId]: value });
  };

  const handlePriceUpdate = async (productId) => {
    const newPrice = newPrices[productId];
    if (!newPrice || isNaN(newPrice)) {
      setError('Please enter a valid price');
      return;
    }
    
    if (!partnerData || !partnerData.id) {
      setError('Partner data not loaded');
      return;
    }
    
    try {
      if (!auth.currentUser) {
        setError('User not authenticated');
        return;
      }
      
      const priceDocId = `${partnerData.id}_${productId}`;
      console.log('=== PRICE UPDATE DEBUG ===');
      console.log('Current User UID:', auth.currentUser.uid);
      console.log('Partner Data ID:', partnerData.id);
      console.log('Document ID format:', priceDocId);
      console.log('Expected format:', auth.currentUser.uid + '_' + productId);
      console.log('Do they match?', priceDocId === (auth.currentUser.uid + '_' + productId));
      console.log('Product ID:', productId);
      console.log('New Price:', newPrice);
      
      // First check if the user is a partner store
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const userData = userDoc.data();
      console.log('Is Partner Store?', userData?.isPartnerStore);
      
      await setDoc(doc(db, 'partner_store_prices', priceDocId), {
        price: parseFloat(newPrice),
        partnerID: partnerData.id,
        productId: productId,
        updatedAt: new Date()
      }, { merge: true });
      
      console.log('Price updated successfully!');
      
      // Update the products state
      setProducts(products.map(product =>
        product.id === productId
          ? { ...product, partnerPrice: parseFloat(newPrice) }
          : product
      ));
      
      // Clear the input
      setNewPrices({ ...newPrices, [productId]: '' });
      
      // Show success message
      setSuccessMessages((prev) => ({ ...prev, [productId]: 'Price updated!' }));
      setError(null);
      
      setTimeout(() => {
        setSuccessMessages((prev) => ({ ...prev, [productId]: '' }));
      }, 3000);
    } catch (err) {
      console.error('=== PRICE UPDATE ERROR ===');
      console.error('Error code:', err.code);
      console.error('Error message:', err.message);
      console.error('Full error:', err);
      setError(`Failed to update price: ${err.message}`);
      alert(`Error updating price: ${err.message}\n\nCheck console for details.`);
    }
  };

  if (loading) return <div className="loading-text">Loading...</div>;

  return (
    <PartnerLayout>
      <div className="manage-products-container">
        <h1 className="manage-products-title">Manage Products</h1>
        {error && (
          <div className="error-message" style={{ 
            color: '#dc3545', 
            padding: '10px', 
            marginBottom: '20px', 
            backgroundColor: '#f8d7da', 
            border: '1px solid #f5c6cb',
            borderRadius: '4px'
          }}>
            {error}
          </div>
        )}
        <div className="products-grid">
          {products.map((product) => (
            <div className="product-card" key={product.id}>
              <img src={product.imageUrl} alt={product.name} className="product-image" />
              <div className="product-name">{product.name}</div>
              <div className="product-price-container">
                <div className="price-section">
                  <div className="price-labels">
                    <span className="price-label">Base Price</span>
                    <span className="price-label">Your Price</span>
                  </div>
                  <div className="price-values">
                    <span className="price-value">₦{product.price.toLocaleString()}</span>
                    <span className="price-value">₦{product.partnerPrice.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="price-input-container">
                <input
                  type="number"
                  className="price-input"
                  placeholder="New price"
                  value={newPrices[product.id] || ''}
                  onChange={e => handlePriceInputChange(product.id, e.target.value)}
                  min="0"
                  step="0.01"
                />
                <button
                  className="update-button"
                  onClick={() => handlePriceUpdate(product.id)}
                >
                  Update
                </button>
              </div>
              {successMessages[product.id] && (
                <div className="success-message" style={{ color: '#059669', marginTop: '0.5rem', fontWeight: 500, textAlign: 'center' }}>
                  {successMessages[product.id]}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </PartnerLayout>
  );
};

export default ManageProducts; 
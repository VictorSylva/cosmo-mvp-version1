import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
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
        const productsSnapshot = await getDocs(collection(db, 'products'));
        const productsData = await Promise.all(
          productsSnapshot.docs.map(async (productDoc) => {
            const partnerPriceDoc = await getDoc(doc(db, 'partner_store_prices', `${partnerData.id}_${productDoc.id}`));
            return {
              id: productDoc.id,
              ...productDoc.data(),
              partnerPrice: partnerPriceDoc.exists() ? partnerPriceDoc.data().price : productDoc.data().price
            };
          })
        );
        setProducts(productsData);
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
    if (!newPrice || isNaN(newPrice)) return;
    try {
      await setDoc(doc(db, 'partner_store_prices', `${partnerData.id}_${productId}`), {
        price: parseFloat(newPrice),
        updatedAt: new Date()
      });
      setProducts(products.map(product =>
        product.id === productId
          ? { ...product, partnerPrice: parseFloat(newPrice) }
          : product
      ));
      setNewPrices({ ...newPrices, [productId]: '' });
      setSuccessMessages((prev) => ({ ...prev, [productId]: 'Price updated!' }));
      setTimeout(() => {
        setSuccessMessages((prev) => ({ ...prev, [productId]: '' }));
      }, 2000);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="loading-text">Loading...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;

  return (
    <PartnerLayout>
      <div className="manage-products-container">
        <h1 className="manage-products-title">Manage Products</h1>
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
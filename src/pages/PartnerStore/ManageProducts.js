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
  const [newQuantities, setNewQuantities] = useState({});
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

        // Fetch partner prices and quantities using a query
        const priceQuery = query(
          collection(db, 'partner_store_prices'),
          where('partnerID', '==', partnerData.id)
        );
        const priceSnapshot = await getDocs(priceQuery);
        
        // Create a map of productId -> { price, quantity }
        const partnerDataMap = priceSnapshot.docs.reduce((acc, doc) => {
          const data = doc.data();
          acc[data.productId] = { 
            price: data.price,
            quantity: data.quantity !== undefined ? data.quantity : 0 // Default to 0 if not set
          };
          return acc;
        }, {});

        // Combine products with partner data
        const updatedProducts = productsData.map((product) => ({
          ...product,
          partnerPrice: partnerDataMap[product.id]?.price ?? product.price,
          partnerQuantity: partnerDataMap[product.id]?.quantity ?? 0,
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

  const handleQuantityInputChange = (productId, value) => {
    setNewQuantities({ ...newQuantities, [productId]: value });
  };

  const handleUpdate = async (productId) => {
    const newPrice = newPrices[productId];
    const newQuantity = newQuantities[productId];
    
    // Use existing values if new ones aren't provided
    const product = products.find(p => p.id === productId);
    const priceToUpdate = newPrice !== undefined && newPrice !== '' ? parseFloat(newPrice) : product.partnerPrice;
    const quantityToUpdate = newQuantity !== undefined && newQuantity !== '' ? parseInt(newQuantity) : product.partnerQuantity;

    if (isNaN(priceToUpdate) || priceToUpdate < 0) {
      setError('Please enter a valid price');
      return;
    }

    if (isNaN(quantityToUpdate) || quantityToUpdate < 0) {
      setError('Please enter a valid quantity');
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
      
      await setDoc(doc(db, 'partner_store_prices', priceDocId), {
        price: priceToUpdate,
        quantity: quantityToUpdate,
        partnerID: partnerData.id,
        productId: productId,
        updatedAt: new Date()
      }, { merge: true });
      
      // Update the products state
      setProducts(products.map(p =>
        p.id === productId
          ? { ...p, partnerPrice: priceToUpdate, partnerQuantity: quantityToUpdate }
          : p
      ));
      
      // Clear the inputs
      setNewPrices(prev => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
      setNewQuantities(prev => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
      
      // Show success message
      setSuccessMessages((prev) => ({ ...prev, [productId]: 'Updated successfully!' }));
      setError(null);
      
      setTimeout(() => {
        setSuccessMessages((prev) => ({ ...prev, [productId]: '' }));
      }, 3000);
    } catch (err) {
      console.error('=== UPDATE ERROR ===', err);
      setError(`Failed to update: ${err.message}`);
    }
  };

  if (loading) return <div className="loading-text">Loading...</div>;

  return (
    <PartnerLayout>
      <div className="manage-products-container">
        <h1 className="manage-products-title">Manage Products & Stock</h1>
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
          {products.map((product) => {
            const isOutOfStock = product.partnerQuantity === 0;
            return (
              <div className="product-card" key={product.id}>
                <div className={`stock-status-badge ${isOutOfStock ? 'out-of-stock' : 'in-stock'}`}>
                  {isOutOfStock ? 'OUT OF STOCK' : 'IN STOCK'}
                </div>
                
                <img src={product.imageUrl} alt={product.name} className="product-image" />
                <div className="product-name">{product.name}</div>
                
                <div className="product-price-container">
                  <div className="price-section">
                    <div className="price-labels">
                      <span>Base Price</span>
                      <span>Your Price</span>
                    </div>
                    <div className="price-values">
                      <span>₦{product.price.toLocaleString()}</span>
                      <span>₦{product.partnerPrice.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="stock-section">
                  <div className="price-labels">
                    <span>Current Stock</span>
                  </div>
                  <div className="price-values">
                    <span className={`stock-quantity ${isOutOfStock ? 'out-of-stock' : 'in-stock'}`}>
                      {product.partnerQuantity} units
                    </span>
                  </div>
                </div>

                <div className="update-form">
                  <div className="input-group">
                    <label>Update Price (₦)</label>
                    <input
                      type="number"
                      className="price-input"
                      placeholder="New price"
                      value={newPrices[product.id] || ''}
                      onChange={e => handlePriceInputChange(product.id, e.target.value)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  
                  <div className="input-group">
                    <label>Update Stock</label>
                    <input
                      type="number"
                      className="price-input"
                      placeholder="New quantity"
                      value={newQuantities[product.id] || ''}
                      onChange={e => handleQuantityInputChange(product.id, e.target.value)}
                      min="0"
                    />
                  </div>

                  <button
                    className="update-button"
                    onClick={() => handleUpdate(product.id)}
                  >
                    Update Product
                  </button>
                </div>

                {successMessages[product.id] && (
                  <div className="success-message" style={{ color: '#059669', marginTop: '0.5rem', fontWeight: 500, textAlign: 'center' }}>
                    {successMessages[product.id]}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </PartnerLayout>
  );
};

export default ManageProducts;
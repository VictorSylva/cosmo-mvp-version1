import React, { useState, useEffect } from 'react';
import { collection, getDocs, setDoc, doc, query, where } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import PartnerLayout from "../components/PartnerDashboard/PartnerLayout";
import { usePartnerStore } from '../contexts/PartnerStoreContext';
import { useNavigate } from 'react-router-dom';
import '../styles/PartnerStoreDashboard.css';

const ManageProducts = () => {
  const { partnerData, loading: partnerLoading } = usePartnerStore();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [priceInputs, setPriceInputs] = useState({});
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    if (partnerData?.id) {
      fetchProducts();
    }
  }, [partnerData]);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const productSnapshot = await getDocs(collection(db, "products"));
      const productsData = productSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const priceQuery = query(
        collection(db, "partner_store_prices"),
        where("partnerID", "==", partnerData.id)
      );
      const priceSnapshot = await getDocs(priceQuery);
      const priceData = priceSnapshot.docs.reduce((acc, doc) => {
        const data = doc.data();
        acc[data.productId] = data.price;
        return acc;
      }, {});

      const updatedProducts = productsData.map((product) => ({
        ...product,
        partnerPrice: priceData[product.id] ?? product.price,
      }));

      setProducts(updatedProducts);
      setLoadingProducts(false);
    } catch (error) {
      console.error("Error fetching products:", error);
      setLoadingProducts(false);
    }
  };

  const handlePriceChange = (id, newPrice) => {
    setPriceInputs((prev) => ({
      ...prev,
      [id]: newPrice,
    }));
  };

  const updatePriceInFirestore = async (id) => {
    const newPrice = priceInputs[id];
    if (!newPrice || !partnerData?.id) return;

    try {
      const priceDocId = `${partnerData.id}_${id}`;
      await setDoc(doc(db, "partner_store_prices", priceDocId), { 
        price: Number(newPrice), 
        partnerID: partnerData.id, 
        productId: id 
      }, { merge: true });

      setProducts((prevProducts) =>
        prevProducts.map((product) =>
          product.id === id ? { ...product, partnerPrice: Number(newPrice) } : product
        )
      );

      setPriceInputs((prev) => ({
        ...prev,
        [id]: "",
      }));

      alert("Price updated successfully!");
    } catch (error) {
      console.error("Error updating price:", error);
      alert("Error updating price. Please try again.");
    }
  };

  if (partnerLoading) {
    return <div className="loading-text">Loading...</div>;
  }

  if (!partnerData) {
    navigate("/partner-login");
    return null;
  }

  return (
    <PartnerLayout>
      <div className="manage-products-container">
        <h1 className="manage-products-title">Manage Products</h1>
        
        {loadingProducts ? (
          <div className="loading-text">Loading products...</div>
        ) : (
          <div className="products-grid">
            {products.map((product) => (
              <div key={product.id} className="product-card">
                <img
                  src={product.imageUrl || "https://via.placeholder.com/150"}
                  alt={product.name}
                  className="product-image"
                />
                <h3 className="product-name">{product.name}</h3>
                <p className="product-description">{product.description}</p>
                <div className="product-price-container">
                  <div className="price-section">
                    <div className="price-labels">
                      <span className="price-label">Base Price</span>
                      <span className="price-label">Your Price</span>
                    </div>
                    <div className="price-values">
                      <span className="price-value">${product.price}</span>
                      <span className="price-value">${product.partnerPrice}</span>
                    </div>
                  </div>
                </div>
                <div className="price-input-container">
                  <input
                    type="number"
                    value={priceInputs[product.id] || ""}
                    onChange={(e) => handlePriceChange(product.id, e.target.value)}
                    placeholder="New price"
                    className="price-input"
                  />
                  <button
                    onClick={() => updatePriceInFirestore(product.id)}
                    className="update-button"
                  >
                    Update
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PartnerLayout>
  );
};

export default ManageProducts; 
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  query,
  orderBy 
} from 'firebase/firestore';
import { db, auth } from '../../firebase/firebaseConfig';
import { signOut } from 'firebase/auth';
import '../../styles/AdminProductManagement.css';
import { FaPlus, FaEdit, FaTrash, FaArrowLeft, FaSave, FaTimes } from 'react-icons/fa';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    description: '',
    imageUrl: ''
  });
  const [notification, setNotification] = useState(null);
  const navigate = useNavigate();

  const categories = [
    'Grains',
    'Fats',
    'Fruits & Vegetables',
    'Dairy',
    'Proteins',
    'Starchy Food',
    'Hydrations'
  ];

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchProducts();
    }
  }, [isAdmin]);

  const checkAdminAccess = async () => {
    const user = auth.currentUser;
    
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const userDoc = await getDocs(collection(db, 'users'));
      const userData = userDoc.docs.find(doc => doc.id === user.uid)?.data();

      if (userData?.role !== 'admin') {
        navigate('/');
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error('Error checking admin access:', error);
      navigate('/');
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const productsRef = collection(db, 'products');
      const querySnapshot = await getDocs(productsRef);
      const productsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('Fetched products from Firebase:', productsData);
      setProducts(productsData);
      
      if (productsData.length === 0) {
        console.log('No products found in Firebase database');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      showNotification('Failed to fetch products: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      category: '',
      description: '',
      imageUrl: ''
    });
    setEditingProduct(null);
    setShowAddForm(false);
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      showNotification('Product name is required', 'error');
      return false;
    }
    if (!formData.price || formData.price <= 0) {
      showNotification('Valid price is required', 'error');
      return false;
    }
    if (!formData.category) {
      showNotification('Category is required', 'error');
      return false;
    }
    return true;
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'products'), productData);
      showNotification('Product added successfully!');
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error('Error adding product:', error);
      showNotification('Failed to add product', 'error');
    }
  };

  const handleEditProduct = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const productRef = doc(db, 'products', editingProduct.id);
      const updateData = {
        ...formData,
        price: parseFloat(formData.price),
        updatedAt: serverTimestamp()
      };

      await updateDoc(productRef, updateData);
      showNotification('Product updated successfully!');
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error('Error updating product:', error);
      showNotification('Failed to update product', 'error');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!await window.showConfirm?.('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'products', productId));
      showNotification('Product deleted successfully!');
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      showNotification('Failed to delete product', 'error');
    }
  };

  const startEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      category: product.category,
      description: product.description || '',
      imageUrl: product.imageUrl || ''
    });
    setShowAddForm(true);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="admin-product-management">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="admin-product-management">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-product-management">
      {/* Header */}
      <div className="admin-header">
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="back-button"
        >
          <FaArrowLeft /> Back to Dashboard
        </button>
        <h1 className="admin-title">Product Management</h1>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="product-form-overlay">
          <div className="product-form-container">
            <div className="form-header">
              <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={resetForm} className="close-button">
                <FaTimes />
              </button>
            </div>
            
            <form onSubmit={editingProduct ? handleEditProduct : handleAddProduct}>
              <div className="form-group">
                <label htmlFor="name">Product Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter product name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="price">Price (₦) *</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="Enter price in Nigerian Naira"
                />
              </div>

              <div className="form-group">
                <label htmlFor="category">Category *</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter product description (optional)"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label htmlFor="imageUrl">Image URL</label>
                <input
                  type="url"
                  id="imageUrl"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  placeholder="Enter image URL (optional)"
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={resetForm} className="cancel-button">
                  Cancel
                </button>
                <button type="submit" className="submit-button">
                  <FaSave /> {editingProduct ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Products List */}
      <div className="products-container">
        <div className="products-header">
          <div className="products-header-left">
            <h2>Products ({products.length})</h2>
            <button 
              onClick={fetchProducts} 
              className="refresh-button"
              title="Refresh products list"
            >
              🔄
            </button>
          </div>
          <button 
            onClick={() => setShowAddForm(true)} 
            className="add-product-button"
          >
            <FaPlus /> Add New Product
          </button>
        </div>

        {products.length === 0 ? (
          <div className="no-products">
            <p>No products found. Add your first product!</p>
          </div>
        ) : (
          <div className="products-grid">
            {products.map(product => (
              <div key={product.id} className="product-card">
                <div className="product-image">
                  <img 
                    src={product.imageUrl || "https://via.placeholder.com/150"} 
                    alt={product.name}
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/150";
                    }}
                  />
                </div>
                <div className="product-info">
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-category">{product.category}</p>
                  <p className="product-price">₦{product.price?.toLocaleString()}</p>
                  {product.description && (
                    <p className="product-description">{product.description}</p>
                  )}
                </div>
                <div className="product-actions">
                  <button 
                    onClick={() => startEdit(product)}
                    className="edit-button"
                    title="Edit product"
                  >
                    <FaEdit />
                  </button>
                  <button 
                    onClick={() => handleDeleteProduct(product.id)}
                    className="delete-button"
                    title="Delete product"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductManagement;

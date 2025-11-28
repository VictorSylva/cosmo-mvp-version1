import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, getDoc, doc } from 'firebase/firestore';
import { db, auth } from '../../firebase/firebaseConfig';
import { useNavigate } from 'react-router-dom';
import { FaChevronDown, FaChevronRight } from 'react-icons/fa';
import '../../styles/AdminDashboard.css';

const InventoryOverview = () => {
  const [partners, setPartners] = useState([]);
  const [products, setProducts] = useState([]);
  const [stockMap, setStockMap] = useState({});
  const [expandedStores, setExpandedStores] = useState({});
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminAccess = async () => {
      const user = auth.currentUser;
      
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();

        if (userData?.role !== 'admin') {
          navigate('/');
          return;
        }

        setIsAdmin(true);
        fetchInventoryData();
      } catch (error) {
        console.error('Error checking admin access:', error);
        navigate('/');
      }
    };

    checkAdminAccess();
  }, [navigate]);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);

      // Fetch all partner stores
      const usersRef = collection(db, 'users');
      const partnersQuery = query(usersRef, where('isPartnerStore', '==', true));
      const partnersSnapshot = await getDocs(partnersQuery);
      
      const partnersData = partnersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Fetch all products
      const productsSnapshot = await getDocs(collection(db, 'products'));
      const productsData = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Fetch all partner stock data
      const allStockSnapshot = await getDocs(collection(db, 'partner_store_prices'));
      const stockMapData = {};
      
      allStockSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const key = `${data.partnerID}_${data.productId}`;
        stockMapData[key] = {
          quantity: data.quantity !== undefined ? data.quantity : 0,
          price: data.price
        };
      });

      setPartners(partnersData);
      setProducts(productsData);
      setStockMap(stockMapData);
    } catch (error) {
      console.error('Error fetching inventory data:', error);
      alert('Failed to load inventory data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleStore = (partnerId) => {
    setExpandedStores(prev => ({
      ...prev,
      [partnerId]: !prev[partnerId]
    }));
  };

  const getStoreInventory = (partnerId) => {
    return products.map(product => {
      const key = `${partnerId}_${product.id}`;
      const stockInfo = stockMap[key];
      
      return {
        productId: product.id,
        productName: product.name,
        productImage: product.imageUrl,
        quantity: stockInfo?.quantity !== undefined ? stockInfo.quantity : 0,
        price: stockInfo?.price !== undefined ? stockInfo.price : product.price,
        basePrice: product.price
      };
    });
  };

  const getStoreSummary = (partnerId) => {
    const inventory = getStoreInventory(partnerId);
    const inStock = inventory.filter(item => item.quantity > 0).length;
    const outOfStock = inventory.filter(item => item.quantity === 0).length;
    return { total: inventory.length, inStock, outOfStock };
  };

  if (loading) {
    return <div className="admin-dashboard">Loading...</div>;
  }

  if (!isAdmin) {
    return <div className="admin-dashboard">Access Denied</div>;
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="back-button"
        >
          Back to Admin Dashboard
        </button>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <h1 className="admin-title" style={{ margin: 0 }}>Inventory Overview</h1>
        </div>
        <div style={{ width: '100px' }}></div>
      </div>

      <div className="inventory-summary" style={{ 
        backgroundColor: 'white', 
        padding: '1.5rem', 
        borderRadius: '0.5rem', 
        marginBottom: '2rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Total Partner Stores</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>
              {partners.length}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Total Products</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>
              {products.length}
            </div>
          </div>
        </div>
      </div>

      {partners.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          No partner stores found
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {partners.map((partner) => {
            const summary = getStoreSummary(partner.id);
            const isExpanded = expandedStores[partner.id];
            const inventory = isExpanded ? getStoreInventory(partner.id) : [];

            return (
              <div key={partner.id} style={{
                backgroundColor: 'white',
                borderRadius: '0.5rem',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                overflow: 'hidden'
              }}>
                <div
                  onClick={() => toggleStore(partner.id)}
                  style={{
                    padding: '1.25rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: isExpanded ? '#f9fafb' : 'white',
                    transition: 'background-color 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                    <div style={{ fontSize: '1.25rem', color: '#3b82f6' }}>
                      {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: 0 }}>
                        {partner.storeName || partner.email}
                      </h3>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                        {partner.email}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase' }}>Total</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827' }}>{summary.total}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase' }}>In Stock</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#2e7d32' }}>{summary.inStock}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase' }}>Out of Stock</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#c62828' }}>{summary.outOfStock}</div>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ borderTop: '1px solid #e5e7eb' }}>
                    <div className="responsive-table-wrapper">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Base Price</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Partner Price</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {inventory.map((item) => (
                            <tr key={item.productId}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                  {item.productImage && (
                                    <img 
                                      src={item.productImage} 
                                      alt={item.productName}
                                      style={{ 
                                        width: '40px', 
                                        height: '40px', 
                                        objectFit: 'cover', 
                                        borderRadius: '0.375rem' 
                                      }}
                                    />
                                  )}
                                  <span className="text-sm font-medium text-gray-900">{item.productName}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                ₦{item.basePrice.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                ₦{item.price.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span style={{ 
                                  fontWeight: 'bold',
                                  color: item.quantity > 0 ? '#2e7d32' : '#c62828'
                                }}>
                                  {item.quantity} units
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span style={{
                                  display: 'inline-flex',
                                  padding: '0.25rem 0.75rem',
                                  fontSize: '0.75rem',
                                  fontWeight: '600',
                                  borderRadius: '9999px',
                                  backgroundColor: item.quantity > 0 ? '#e8f5e9' : '#ffebee',
                                  color: item.quantity > 0 ? '#2e7d32' : '#c62828',
                                  border: `1px solid ${item.quantity > 0 ? '#a5d6a7' : '#ef9a9a'}`
                                }}>
                                  {item.quantity > 0 ? 'In Stock' : 'Out of Stock'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default InventoryOverview;

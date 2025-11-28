import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from '../firebase/firebaseConfig';
import { useNavigate } from 'react-router-dom';
import { FaMapMarkerAlt, FaStore, FaBox, FaPhone, FaEnvelope } from 'react-icons/fa';
import '../styles/Wallet.css';

const NearbyStores = () => {
  const [walletItems, setWalletItems] = useState([]);
  const [stores, setStores] = useState([]);
  const [filteredStores, setFilteredStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationPermission, setLocationPermission] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [radiusKm, setRadiusKm] = useState(10);
  const navigate = useNavigate();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      navigate('/login');
      return;
    }

    requestLocation();
    fetchData();
  }, [navigate]);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationPermission('unsupported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setLocationPermission('granted');
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocationPermission('denied');
      }
    );
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;

      // Fetch user's wallet items
      const walletRef = collection(db, 'users', user.uid, 'wallet');
      const walletSnapshot = await getDocs(walletRef);
      
      const itemsMap = new Map();
      walletSnapshot.docs.forEach(doc => {
        const data = doc.data();
        // Skip sent items
        if (data.status === 'sent') return;
        
        const productId = data.productId;
        if (itemsMap.has(productId)) {
          const existing = itemsMap.get(productId);
          itemsMap.set(productId, {
            ...existing,
            quantity: (existing.quantity || 1) + (data.quantity || 1)
          });
        } else {
          itemsMap.set(productId, {
            productId: data.productId,
            productName: data.productName,
            imageUrl: data.imageUrl,
            quantity: data.quantity || 1
          });
        }
      });

      const walletItemsArray = Array.from(itemsMap.values());
      setWalletItems(walletItemsArray);

      if (walletItemsArray.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch all partner stores
      const usersRef = collection(db, 'users');
      const partnersQuery = query(usersRef, where('isPartnerStore', '==', true));
      const partnersSnapshot = await getDocs(partnersQuery);

      const partnersData = partnersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Fetch stock data for all stores
      const stockSnapshot = await getDocs(collection(db, 'partner_store_prices'));
      const stockMap = {};

      stockSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const key = `${data.partnerID}_${data.productId}`;
        stockMap[key] = {
          quantity: data.quantity !== undefined ? data.quantity : 0,
          price: data.price
        };
      });

      // Filter stores that have at least one wallet item in stock
      const storesWithStock = partnersData.map(partner => {
        const availableItems = walletItemsArray.filter(item => {
          const key = `${partner.id}_${item.productId}`;
          const stock = stockMap[key];
          return stock && stock.quantity > 0;
        }).map(item => {
          const key = `${partner.id}_${item.productId}`;
          const stock = stockMap[key];
          return {
            ...item,
            partnerPrice: stock.price,
            availableQuantity: stock.quantity
          };
        });

        if (availableItems.length > 0) {
          return {
            ...partner,
            availableItems,
            totalAvailableItems: availableItems.length
          };
        }
        return null;
      }).filter(Boolean);

      setStores(storesWithStock);
      setFilteredStores(storesWithStock);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to load stores. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRadiusChange = (e) => {
    setRadiusKm(parseInt(e.target.value));
  };

  if (loading) {
    return (
      <div className="wallet-container">
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '1.5rem', color: '#6b7280' }}>Loading nearby stores...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="wallet-container">
      <div style={{ marginBottom: '2rem' }}>
        <button
          onClick={() => navigate('/wallet')}
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}
        >
          ← Back to Wallet
        </button>
      </div>

      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem', color: '#111827' }}>
        Nearby Stores
      </h1>

      {/* Location Status */}
      <div style={{
        backgroundColor: locationPermission === 'granted' ? '#f0fdf4' : '#fef2f2',
        padding: '1rem',
        borderRadius: '0.5rem',
        marginBottom: '1.5rem',
        border: `1px solid ${locationPermission === 'granted' ? '#86efac' : '#fecaca'}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FaMapMarkerAlt style={{ color: locationPermission === 'granted' ? '#059669' : '#dc2626' }} />
          <span style={{ fontWeight: '500', color: locationPermission === 'granted' ? '#059669' : '#dc2626' }}>
            {locationPermission === 'granted' && 'Location access granted'}
            {locationPermission === 'denied' && 'Location access denied - showing all stores'}
            {locationPermission === 'unsupported' && 'Geolocation not supported - showing all stores'}
            {!locationPermission && 'Requesting location access...'}
          </span>
        </div>
        {userLocation && (
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
            Your location: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
          </div>
        )}
      </div>

      {/* Wallet Items Summary */}
      {walletItems.length > 0 && (
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          marginBottom: '1.5rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
            Your Wallet Items ({walletItems.length})
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
            {walletItems.map(item => (
              <div key={item.productId} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem',
                backgroundColor: '#f9fafb',
                borderRadius: '0.375rem'
              }}>
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.productName}
                    style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '0.25rem' }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.productName}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    Qty: {item.quantity}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Wallet Items */}
      {walletItems.length === 0 && (
        <div style={{
          backgroundColor: 'white',
          padding: '3rem',
          borderRadius: '0.5rem',
          textAlign: 'center',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <FaBox style={{ fontSize: '3rem', color: '#d1d5db', marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>
            No Items in Wallet
          </h2>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            Add items to your wallet to find nearby stores
          </p>
          <button
            onClick={() => navigate('/products')}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.375rem',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500'
            }}
          >
            Browse Products
          </button>
        </div>
      )}

      {/* Stores List */}
      {walletItems.length > 0 && (
        <>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>
              Stores with Your Items ({filteredStores.length})
            </h2>
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              Showing partner stores that have your wallet items in stock
            </p>
          </div>

          {filteredStores.length === 0 && (
            <div style={{
              backgroundColor: 'white',
              padding: '3rem',
              borderRadius: '0.5rem',
              textAlign: 'center',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}>
              <FaStore style={{ fontSize: '3rem', color: '#d1d5db', marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>
                No Stores Found
              </h3>
              <p style={{ color: '#6b7280' }}>
                No partner stores currently have your wallet items in stock
              </p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredStores.map(store => (
              <div key={store.id} style={{
                backgroundColor: 'white',
                borderRadius: '0.5rem',
                padding: '1.5rem',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>
                      {store.storeName || store.email}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem', color: '#6b7280' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FaMapMarkerAlt />
                        <span>{store.address}</span>
                      </div>
                      {store.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <FaPhone />
                          <span>{store.phone}</span>
                        </div>
                      )}
                      {store.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <FaEnvelope />
                          <span>{store.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{
                    backgroundColor: '#eff6ff',
                    color: '#1e40af',
                    padding: '0.5rem 1rem',
                    borderRadius: '9999px',
                    fontSize: '0.875rem',
                    fontWeight: '600'
                  }}>
                    {store.totalAvailableItems} item{store.totalAvailableItems !== 1 ? 's' : ''} available
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Available Items
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '0.75rem' }}>
                    {store.availableItems.map(item => (
                      <div key={item.productId} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem',
                        backgroundColor: '#f9fafb',
                        borderRadius: '0.375rem',
                        border: '1px solid #e5e7eb'
                      }}>
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt={item.productName}
                            style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '0.25rem' }}
                          />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827', marginBottom: '0.25rem' }}>
                            {item.productName}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            Stock: <span style={{ fontWeight: '600', color: '#059669' }}>{item.availableQuantity} units</span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            Price: ₦{item.partnerPrice.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default NearbyStores;

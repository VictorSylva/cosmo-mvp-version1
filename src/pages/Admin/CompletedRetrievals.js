import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase/firebaseConfig';
import { useNavigate } from 'react-router-dom';

const CompletedRetrievals = () => {
  const [retrievals, setRetrievals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPartnerView, setIsPartnerView] = useState(false);
  const [storeNames, setStoreNames] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    const user = auth.currentUser;
    if (user) {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      setIsPartnerView(userData?.isPartnerStore === true);
      fetchRetrievals(user.uid, userData?.isPartnerStore === true);
    }
  };

  const fetchStoreNames = async (partnerIds) => {
    const uniquePartnerIds = [...new Set(partnerIds)];
    const names = {};
    
    for (const partnerId of uniquePartnerIds) {
      if (!partnerId) continue;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', partnerId));
        if (userDoc.exists()) {
          const data = userDoc.data();
          names[partnerId] = data.storeName || data.name || 'Unknown Store';
        }
      } catch (error) {
        console.error(`Error fetching store name for ${partnerId}:`, error);
      }
    }
    
    return names;
  };

  const fetchRetrievals = async (userId, isPartner) => {
    try {
      const retrievalsRef = collection(db, 'redemptions');
      let q;
      
      if (isPartner) {
        // If partner store, only show their retrievals
        q = query(
          retrievalsRef,
          where('confirmedByPartner', '==', userId),
          where('status', '==', 'confirmed'),
          orderBy('createdAt', 'desc')
        );
      } else {
        // If admin, show all retrievals
        q = query(
          retrievalsRef,
          where('status', '==', 'confirmed'),
          orderBy('createdAt', 'desc')
        );
      }
      
      const querySnapshot = await getDocs(q);
      const retrievalsData = [];

      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        
        // Handle multi-product redemptions
        if (data.products && Array.isArray(data.products)) {
          data.products.forEach(product => {
            retrievalsData.push({
              id: doc.id,
              customerEmail: data.userName,
              confirmedByPartner: data.confirmedByPartner,
              createdAt: data.createdAt?.toDate() || new Date(),
              confirmedAt: data.confirmedAt ? new Date(data.confirmedAt) : null,
              productName: product.productName,
              prepaidPrice: product.prepaidPrice,
              productId: product.productId,
              imageUrl: product.imageUrl
            });
          });
        } else {
          // Handle legacy single-product redemptions
          retrievalsData.push({
            id: doc.id,
            customerEmail: data.userName,
            confirmedByPartner: data.confirmedByPartner,
            createdAt: data.createdAt?.toDate() || new Date(),
            confirmedAt: data.confirmedAt ? new Date(data.confirmedAt) : null,
            productName: data.productName || 'Unknown Product',
            prepaidPrice: data.prepaidPrice || 0,
            productId: data.productID || 'unknown',
            imageUrl: data.imageUrl
          });
        }
      });

      // Sort retrievals by date
      retrievalsData.sort((a, b) => b.createdAt - a.createdAt);

      // Fetch store names for partner IDs
      const partnerIds = [...new Set(retrievalsData.map(r => r.confirmedByPartner))];
      const storeNames = await fetchStoreNames(partnerIds);
      
      setRetrievals(retrievalsData);
      setStoreNames(storeNames);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching retrievals:', error);
      alert('Failed to fetch retrievals. Please try again later.');
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  };

  return (
    <div className="p-6" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <button
        onClick={() => navigate('/admin/dashboard')}
        style={{ backgroundColor: '#3b82f6', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', marginBottom: '16px', fontWeight: 500, cursor: 'pointer' }}
      >
        Back to Admin Dashboard
      </button>
      <h1 style={{
        fontSize: '24px',
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: '24px',
        borderBottom: '2px solid #e5e7eb',
        paddingBottom: '12px'
      }}>
        {isPartnerView ? 'Your Completed Retrievals' : 'All Completed Retrievals'}
      </h1>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>
      ) : (
        <div style={{
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}>
          <div className="responsive-table-wrapper">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f9fafb' }}>
                <tr>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    borderBottom: '1px solid #e5e7eb'
                  }}>ID</th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    borderBottom: '1px solid #e5e7eb'
                  }}>Product</th>
                  {!isPartnerView && (
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      borderBottom: '1px solid #e5e7eb'
                    }}>Partner Store</th>
                  )}
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    borderBottom: '1px solid #e5e7eb'
                  }}>Customer</th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    borderBottom: '1px solid #e5e7eb'
                  }}>Prepaid Price</th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    borderBottom: '1px solid #e5e7eb'
                  }}>Retrieved At</th>
                </tr>
              </thead>
              <tbody>
                {retrievals.length === 0 ? (
                  <tr>
                    <td 
                      colSpan={isPartnerView ? 5 : 6} 
                      style={{
                        padding: '16px',
                        textAlign: 'center',
                        color: '#6b7280'
                      }}
                    >
                      No completed retrievals found
                    </td>
                  </tr>
                ) : (
                  retrievals.map((retrieval, index) => (
                    <tr 
                      key={`${retrieval.id}-${index}`}
                      style={{
                        borderBottom: '1px solid #e5e7eb',
                        transition: 'background-color 0.2s',
                        ':hover': {
                          backgroundColor: '#f9fafb'
                        }
                      }}
                    >
                      <td style={{
                        padding: '16px',
                        fontSize: '14px',
                        color: '#1f2937'
                      }}>{retrieval.id}</td>
                      <td style={{
                        padding: '16px',
                        fontSize: '14px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          {retrieval.imageUrl && (
                            <div style={{
                              width: '48px',
                              height: '48px',
                              marginRight: '12px',
                              borderRadius: '4px',
                              overflow: 'hidden',
                              border: '1px solid #e5e7eb'
                            }}>
                              <img
                                src={retrieval.imageUrl}
                                alt={retrieval.productName}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover'
                                }}
                              />
                            </div>
                          )}
                          <div style={{
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#1f2937'
                          }}>
                            {retrieval.productName}
                          </div>
                        </div>
                      </td>
                      {!isPartnerView && (
                        <td style={{
                          padding: '16px',
                          fontSize: '14px',
                          color: '#1f2937'
                        }}>
                          {storeNames[retrieval.confirmedByPartner] || 'Unknown Store'}
                        </td>
                      )}
                      <td style={{
                        padding: '16px',
                        fontSize: '14px',
                        color: '#1f2937'
                      }}>
                        {retrieval.customerEmail}
                      </td>
                      <td style={{
                        padding: '16px',
                        fontSize: '14px',
                        color: '#1f2937'
                      }}>
                        ₦{retrieval.prepaidPrice.toFixed(2)}
                      </td>
                      <td style={{
                        padding: '16px',
                        fontSize: '14px',
                        color: '#1f2937'
                      }}>
                        {formatDate(retrieval.confirmedAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompletedRetrievals; 
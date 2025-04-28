import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { usePartnerStore } from '../../contexts/PartnerStoreContext';
import PartnerLayout from '../../components/PartnerDashboard/PartnerLayout';
import '../../styles/PartnerStoreDashboard.css';

const Analytics = () => {
  const { partnerData } = usePartnerStore();
  const [analytics, setAnalytics] = useState({
    totalRedemptions: 0,
    totalRevenue: 0,
    averagePriceDifference: 0,
    products: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Get all redemptions for this partner
        const redemptionsQuery = query(
          collection(db, 'redemptions'),
          where('confirmedByPartner', '==', partnerData.id)
        );
        const redemptionsSnapshot = await getDocs(redemptionsQuery);
        
        // Get all payments for this partner
        const paymentsQuery = query(
          collection(db, 'payments'),
          where('partnerId', '==', partnerData.id)
        );
        const paymentsSnapshot = await getDocs(paymentsQuery);

        const redemptions = redemptionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        const payments = paymentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Calculate analytics
        const totalRedemptions = redemptions.length;
        const totalRevenue = payments.reduce((sum, payment) => sum + payment.finalPrice, 0);
        const averagePriceDifference = payments.reduce((sum, payment) => sum + payment.priceDifference, 0) / payments.length;

        // Calculate product-wise analytics
        const products = {};
        payments.forEach(payment => {
          if (!products[payment.productId]) {
            products[payment.productId] = {
              name: payment.productName,
              count: 0,
              totalRevenue: 0,
              averagePriceDifference: 0
            };
          }
          products[payment.productId].count++;
          products[payment.productId].totalRevenue += payment.finalPrice;
          products[payment.productId].averagePriceDifference += payment.priceDifference;
        });

        // Calculate averages for each product
        Object.keys(products).forEach(productId => {
          products[productId].averagePriceDifference /= products[productId].count;
        });

        setAnalytics({
          totalRedemptions,
          totalRevenue,
          averagePriceDifference,
          products
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (partnerData) {
      fetchAnalytics();
    }
  }, [partnerData]);

  if (loading) return <div className="loading-text">Loading...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;

  return (
    <PartnerLayout>
      <div className="dashboard-container">
        <h1 className="dashboard-title">Analytics Dashboard</h1>
        
        <div className="analytics-cards">
          <div className="analytics-card">
            <h3>Total Redemptions</h3>
            <p>{analytics.totalRedemptions}</p>
          </div>
          <div className="analytics-card">
            <h3>Total Revenue</h3>
            <p>₦{analytics.totalRevenue.toFixed(2)}</p>
          </div>
          <div className="analytics-card">
            <h3>Average Price Difference</h3>
            <p>₦{analytics.averagePriceDifference.toFixed(2)}</p>
          </div>
        </div>

        <div className="analytics-table">
          <h2>Product Performance</h2>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Redemptions</th>
                <th>Total Revenue</th>
                <th>Avg. Price Difference</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(analytics.products).map(([productId, data]) => (
                <tr key={productId}>
                  <td>{data.name}</td>
                  <td>{data.count}</td>
                  <td>₦{data.totalRevenue.toFixed(2)}</td>
                  <td>₦{data.averagePriceDifference.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PartnerLayout>
  );
};

export default Analytics; 
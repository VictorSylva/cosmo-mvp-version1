import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { usePartnerStore } from '../../contexts/PartnerStoreContext';
import PartnerLayout from '../../components/PartnerDashboard/PartnerLayout';
import '../../styles/PartnerStoreDashboard.css';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

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
          {/* Compact Individual Product Doughnut Charts */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginTop: '1rem', justifyContent: 'center' }}>
              {Object.entries(analytics.products).map(([productId, data]) => (
              <div key={productId} style={{ flex: '1 1 180px', minWidth: 140, maxWidth: 180, background: '#fff', borderRadius: '10px', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.08)', padding: '0.75rem 0.5rem', marginBottom: '0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem', color: '#222', textAlign: 'center', width: '100%' }}>{data.name}</div>
                <Doughnut
                  data={{
                    labels: ['Redemptions', 'Total Revenue', 'Avg. Price Diff'],
                    datasets: [
                      {
                        data: [data.count, data.totalRevenue, data.averagePriceDifference],
                        backgroundColor: [
                          'rgba(247, 13, 5, 0.85)',
                          'rgba(7, 141, 101, 0.85)',
                          'rgba(255, 193, 7, 0.85)'
                        ],
                        borderWidth: 1,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            let label = context.label || '';
                            let value = context.parsed;
                            if (context.dataIndex === 1 || context.dataIndex === 2) {
                              return `${label}: ₦${value.toLocaleString()}`;
                            }
                            return `${label}: ${value}`;
                          }
                        }
                      }
                    },
                  }}
                  height={120}
                  style={{ minHeight: 120, maxHeight: 120 }}
                />
                {/* Value legend below the chart */}
                <div style={{ width: '100%', marginTop: 8 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: 'rgba(247, 13, 5, 0.85)' }}></span>
                      <span style={{ fontSize: 12 }}>Redemptions:</span>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{data.count}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: 'rgba(7, 141, 101, 0.85)' }}></span>
                      <span style={{ fontSize: 12 }}>Total Revenue:</span>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>₦{data.totalRevenue.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: 'rgba(255, 193, 7, 0.85)' }}></span>
                      <span style={{ fontSize: 12 }}>Avg. Price Diff:</span>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>₦{data.averagePriceDifference.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PartnerLayout>
  );
};

export default Analytics; 
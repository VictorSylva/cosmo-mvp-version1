import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { usePartnerStore } from '../../contexts/PartnerStoreContext';
import PartnerLayout from '../../components/PartnerDashboard/PartnerLayout';
import '../../styles/PartnerStoreDashboard.css';

const PaymentHistory = () => {
  const { partnerData } = usePartnerStore();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const paymentsQuery = query(
          collection(db, 'payments'),
          where('partnerId', '==', partnerData.id),
          orderBy('createdAt', 'desc')
        );
        const paymentsSnapshot = await getDocs(paymentsQuery);
        const paymentsData = paymentsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
            processedAt: data.processedAt ? (data.processedAt.toDate ? data.processedAt.toDate() : new Date(data.processedAt)) : null,
          };
        });
        setPayments(paymentsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (partnerData) {
      fetchPayments();
    }
  }, [partnerData]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount || 0).replace('NGN', '₦');
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return date.toLocaleString();
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'pending':
        return 'payment-status-pending';
      case 'approved':
        return 'payment-status-approved';
      case 'rejected':
        return 'payment-status-rejected';
      case 'completed':
        return 'payment-status-completed';
      default:
        return 'payment-status-default';
    }
  };

  if (loading) return <div className="loading-text">Loading...</div>;
  if (error) return <div className="payment-error">Error: {error}</div>;

  return (
    <PartnerLayout>
      <div className="payment-history-container">
        <h1 className="payment-history-title">Payment History</h1>
        <div className="payment-table-container">
          <table className="payment-table">
            <thead className="payment-table-header">
              <tr>
                <th>Product</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Created</th>
                <th>Processed</th>
              </tr>
            </thead>
            <tbody className="payment-table-body">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan="5" className="payment-empty">
                    No payments found
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id}>
                    <td data-label="Product">
                      <div className="payment-product-name">{payment.productName}</div>
                      <div className="payment-product-id">ID: {payment.id}</div>
                    </td>
                    <td data-label="Amount">
                      <div className="payment-amount">{formatCurrency(payment.finalPrice)}</div>
                      <div className="payment-difference">
                        Difference: {formatCurrency(payment.priceDifference)}
                      </div>
                    </td>
                    <td data-label="Status">
                      <span className={`payment-status ${getStatusClass(payment.status)}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td data-label="Created">{formatDate(payment.createdAt)}</td>
                    <td data-label="Processed">{formatDate(payment.processedAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PartnerLayout>
  );
};

export default PaymentHistory; 
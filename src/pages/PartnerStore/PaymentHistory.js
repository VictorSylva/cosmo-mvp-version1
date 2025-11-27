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
        console.log('Fetching payments for partner:', partnerData.id);
        
        // Query for payments with either partnerId or partnerID field
        // Try both field names and combine results
        const results1 = await getDocs(
          query(collection(db, 'payments'), where('partnerId', '==', partnerData.id))
        );
        
        const results2 = await getDocs(
          query(collection(db, 'payments'), where('partnerID', '==', partnerData.id))
        );
        
        console.log('Found payments with partnerId:', results1.docs.length);
        console.log('Found payments with partnerID:', results2.docs.length);
        
        // Combine results and remove duplicates
        const allDocs = [...results1.docs, ...results2.docs];
        const uniqueDocs = allDocs.filter((doc, index, self) =>
          index === self.findIndex(d => d.id === doc.id)
        );
        
        const paymentsData = uniqueDocs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date()),
            processedAt: data.processedAt ? (data.processedAt.toDate ? data.processedAt.toDate() : new Date(data.processedAt)) : null,
          };
        });
        
        // Sort by createdAt descending
        paymentsData.sort((a, b) => {
          const dateA = a.createdAt?.getTime ? a.createdAt.getTime() : 0;
          const dateB = b.createdAt?.getTime ? b.createdAt.getTime() : 0;
          return dateB - dateA;
        });
        
        console.log('Total unique payments:', paymentsData.length);
        console.log('Final payments:', paymentsData);
        
        setPayments(paymentsData);
      } catch (err) {
        console.error('Error fetching payments:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (partnerData) {
      console.log('Partner data:', partnerData);
      fetchPayments();
    } else {
      console.log('No partner data available');
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

  const getProcessedDisplay = (payment) => {
    if (payment.processedAt) {
      return { text: formatDate(payment.processedAt), class: '' };
    }
    
    switch (payment.status) {
      case 'pending':
        return { text: 'Awaiting processing', class: 'pending' };
      case 'approved':
        return { text: 'Approved - Awaiting completion', class: 'approved' };
      case 'rejected':
        return { text: 'Rejected', class: 'rejected' };
      case 'completed':
        return { text: 'Completed', class: 'completed' };
      default:
        return { text: 'N/A', class: '' };
    }
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
                      <div className="payment-product-quantity">
                        {payment.quantity ? `Quantity: ${payment.quantity}` : 'Quantity: 1'}
                      </div>
                      <div className="payment-product-id">ID: {payment.id}</div>
                    </td>
                    <td data-label="Amount">
                      <div className="payment-amount">
                        {payment.quantity && payment.quantity > 1 
                          ? `${formatCurrency(payment.unitFinalPrice || payment.finalPrice)} × ${payment.quantity} = ${formatCurrency(payment.finalPrice)}`
                          : formatCurrency(payment.finalPrice)
                        }
                      </div>
                      <div className="payment-difference">
                        Difference: {formatCurrency(payment.priceDifference)}
                        {payment.quantity && payment.quantity > 1 && (
                          <div className="payment-unit-difference">
                            (Unit diff: {formatCurrency(payment.unitPriceDifference || (payment.priceDifference / payment.quantity))})
                          </div>
                        )}
                      </div>
                    </td>
                    <td data-label="Status">
                      <span className={`payment-status ${getStatusClass(payment.status)}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td data-label="Created">{formatDate(payment.createdAt)}</td>
                    <td data-label="Processed">
                      {(() => {
                        const display = getProcessedDisplay(payment);
                        return (
                          <span className={`payment-processed-display ${display.class}`}>
                            {display.text}
                          </span>
                        );
                      })()}
                    </td>
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
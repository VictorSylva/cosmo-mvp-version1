import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import PartnerLayout from "../components/PartnerDashboard/PartnerLayout";
import { usePartnerStore } from '../contexts/PartnerStoreContext';
import { useNavigate } from 'react-router-dom';
import '../styles/PartnerStoreDashboard.css';

const PaymentHistory = () => {
  const { partnerData, loading: partnerLoading } = usePartnerStore();
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [paymentError, setPaymentError] = useState(null);

  useEffect(() => {
    if (partnerData?.id) {
      fetchPayments();
    }
  }, [partnerData]);

  const fetchPayments = async () => {
    try {
      setLoadingPayments(true);
      setPaymentError(null);
      
      const paymentsRef = collection(db, "payments");
      const q = query(
        paymentsRef, 
        where("partnerId", "==", partnerData.id),
        orderBy("createdAt", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      
      const paymentsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          processedAt: data.processedAt ? new Date(data.processedAt) : null,
          completedAt: data.completedAt ? new Date(data.completedAt) : null
        };
      });
      
      setPayments(paymentsData);
      setLoadingPayments(false);
    } catch (error) {
      console.error("Error fetching payments:", error);
      setPaymentError(error.message);
      setLoadingPayments(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'NGN'
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

  if (partnerLoading) {
    return <div className="loading-text">Loading...</div>;
  }

  if (!partnerData) {
    navigate("/partner-login");
    return null;
  }

  return (
    <PartnerLayout>
      <div className="payment-history-container">
        <h1 className="payment-history-title">Payment History</h1>
        
        {paymentError && (
          <div className="payment-error">
            {paymentError}
          </div>
        )}

        {loadingPayments ? (
          <div className="loading-text">Loading payments...</div>
        ) : (
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
                      <td data-label="Created">
                        {formatDate(payment.createdAt)}
                      </td>
                      <td data-label="Processed">
                        {formatDate(payment.processedAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PartnerLayout>
  );
};

export default PaymentHistory; 
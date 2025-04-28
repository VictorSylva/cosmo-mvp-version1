import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, updateDoc, query, where, orderBy, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/firebaseConfig';
import { signOut } from 'firebase/auth';
import '../styles/AdminDashboard.css';
import { FaStore, FaMoneyBillWave, FaBoxes } from 'react-icons/fa';

const AdminDashboard = () => {
  const [payments, setPayments] = useState([]);
  const [allPayments, setAllPayments] = useState([]);
  const [retrievals, setRetrievals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('pending'); // 'pending', 'approved', 'completed'
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState([]);
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
      } catch (error) {
        console.error('Error checking admin access:', error);
        navigate('/');
      }

      setLoading(false);
    };

    checkAdminAccess();
  }, [navigate]);

  useEffect(() => {
    fetchAllPayments();
    fetchRetrievals();
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchFilteredPayments();
  }, [filter]);

  const fetchAllPayments = async () => {
    try {
      const paymentsRef = collection(db, 'payments');
      const q = query(
        paymentsRef,
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const paymentsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setAllPayments(paymentsData);
      setError(null);
    } catch (error) {
      console.error('Error fetching all payments:', error);
      setError('Failed to load payments');
    }
  };

  const fetchFilteredPayments = async () => {
    try {
      const paymentsRef = collection(db, 'payments');
      const q = query(
        paymentsRef,
        where('status', '==', filter),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const paymentsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setPayments(paymentsData);
      setError(null);
    } catch (error) {
      console.error('Error fetching filtered payments:', error);
      setError('Failed to load payments');
    }
  };

  const fetchRetrievals = async () => {
    try {
      const retrievalsRef = collection(db, 'redemptions');
      const q = query(
        retrievalsRef,
        where('status', '==', 'confirmed'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const retrievalsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setRetrievals(retrievalsData);
      setError(null);
    } catch (error) {
      console.error('Error fetching retrievals:', error);
      setError('Failed to load retrievals');
    }
  };

  const fetchUsers = async () => {
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("isPartnerStore", "==", true));
      const querySnapshot = await getDocs(q);
      const usersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersList);
    } catch (error) {
      console.error("Error fetching users:", error);
      alert("Failed to fetch users. Please try again later.");
    }
  };

  const processPayment = async (paymentId, status) => {
    try {
      const paymentRef = doc(db, 'payments', paymentId);
      await updateDoc(paymentRef, {
        status: status,
        processedAt: new Date().toISOString(),
        processedBy: auth.currentUser?.uid
      });
      
      fetchAllPayments();
      fetchFilteredPayments();
    } catch (err) {
      console.error('Error processing payment:', err.message);
    }
  };

  const completePayment = async (paymentId) => {
    try {
      const paymentRef = doc(db, 'payments', paymentId);
      await updateDoc(paymentRef, {
        status: 'completed',
        completedAt: new Date().toISOString(),
        completedBy: auth.currentUser?.uid
      });
      
      fetchAllPayments();
      fetchFilteredPayments();
    } catch (err) {
      console.error('Error completing payment:', err.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      alert('Failed to sign out. Please try again.');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return date.toLocaleString();
  };

  const getStatusBadgeClass = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20';
      case 'approved':
        return 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20';
      case 'completed':
        return 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20';
      case 'rejected':
        return 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20';
      default:
        return 'bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-600/20';
    }
  };

  const getSummaryStats = () => {
    const totalRetrievals = retrievals.length;
    const totalPayments = allPayments.length;
    const pendingPayments = allPayments.filter(p => p.status === 'pending').length;
    const totalAmount = allPayments.reduce((sum, p) => sum + (p.finalPrice || 0), 0);
    const pendingAmount = allPayments
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + (p.finalPrice || 0), 0);

    return {
      totalRetrievals,
      totalPayments,
      pendingPayments,
      totalAmount,
      pendingAmount
    };
  };

  if (loading) {
    return <div className="admin-dashboard">Loading...</div>;
  }

  if (!isAdmin) {
    return <div className="admin-dashboard">Access Denied</div>;
  }

  const stats = getSummaryStats();

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1 className="admin-title">Admin Dashboard</h1>
        <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-title">Total Retrievals</div>
          <div className="stat-value">{stats.totalRetrievals}</div>
              </div>
        <div className="stat-card">
          <div className="stat-title">Total Payments</div>
          <div className="stat-value">{stats.totalPayments}</div>
              </div>
        <div className="stat-card">
          <div className="stat-title">Pending Payments</div>
          <div className="stat-value">{stats.pendingPayments}</div>
            </div>
          </div>

      <div className="sections-grid">
        <div className="section-card" onClick={() => navigate('/admin/payments')}>
          <div className="section-icon">
            <FaMoneyBillWave />
          </div>
          <h2 className="section-title">Partner Store Payments</h2>
          <p className="section-description">
            Manage and process payments for partner stores
          </p>
              </div>

        <div className="section-card" onClick={() => navigate('/admin/retrievals')}>
          <div className="section-icon">
            <FaBoxes />
                  </div>
          <h2 className="section-title">Completed Retrievals</h2>
          <p className="section-description">
            View and manage completed product retrievals
          </p>
              </div>

        <div className="section-card" onClick={() => navigate('/admin/stores')}>
          <div className="section-icon">
            <FaStore />
                  </div>
          <h2 className="section-title">Partner Stores</h2>
          <p className="section-description">
            Manage partner store registrations and details
          </p>
            </div>
      </div>

      <div className="users-list">
        <h2>Partner Stores</h2>
        {users.length === 0 ? (
          <p>No partner stores found.</p>
        ) : (
          <ul>
            {users.map(user => (
              <li key={user.id}>
                <p>Email: {user.email}</p>
                <p>Phone: {user.phone || "Not provided"}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard; 
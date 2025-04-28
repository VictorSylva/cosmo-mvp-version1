import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from '../firebase/firebaseConfig';
import { signOut } from 'firebase/auth';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
      const user = auth.currentUser;
        if (!user) {
          navigate('/login');
          return;
        }

        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', user.email));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          setUserData(userDoc.data());
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        alert('Failed to load user data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      alert('Failed to sign out. Please try again.');
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
      {userData && (
        <div className="user-info">
          <h2>Welcome, {userData.email}</h2>
          {userData.isPartnerStore && (
            <div className="partner-info">
              <h3>Partner Store Information</h3>
              <p>Phone: {userData.phone || 'Not provided'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import PartnerLayout from "../components/PartnerDashboard/PartnerLayout";
import { usePartnerStore } from '../contexts/PartnerStoreContext';
import { useNavigate } from 'react-router-dom';
import '../styles/PartnerStoreDashboard.css';
import {
  CurrencyDollarIcon,
  ShoppingBagIcon,
  ClockIcon,
  QrCodeIcon
} from "@heroicons/react/24/outline";

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="stat-card">
    <div className="stat-card-content">
      <div className="stat-card-inner">
        <div className="stat-card-icon">
          <Icon style={{ color }} />
        </div>
        <div className="stat-card-text">
          <dl>
            <dt className="stat-card-title">{title}</dt>
            <dd className="stat-card-value">{value}</dd>
          </dl>
        </div>
      </div>
    </div>
  </div>
);

const Analytics = () => {
  const { partnerData, loading: partnerLoading } = usePartnerStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalPayments: 0,
    pendingPayments: 0,
    recentScans: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (partnerData?.id) {
      fetchStats();
    }
  }, [partnerData]);

  const fetchStats = async () => {
    if (!partnerData?.id) return;
    try {
      // Fetch total products
      const priceQuery = query(
        collection(db, "partner_store_prices"),
        where("partnerID", "==", partnerData.id)
      );
      const priceSnapshot = await getDocs(priceQuery);
      
      // Fetch all payments
      const paymentsQuery = query(
        collection(db, "payments"),
        where("partnerId", "==", partnerData.id)
      );
      const paymentsSnapshot = await getDocs(paymentsQuery);
      
      // Fetch pending payments
      const pendingPaymentsQuery = query(
        collection(db, "payments"),
        where("partnerId", "==", partnerData.id),
        where("status", "==", "pending")
      );
      const pendingPaymentsSnapshot = await getDocs(pendingPaymentsQuery);

      // Fetch recent scans (redemptions)
      const scansQuery = query(
        collection(db, "redemptions"),
        where("confirmedByPartner", "==", partnerData.id)
      );
      const scansSnapshot = await getDocs(scansQuery);

      setStats({
        totalProducts: priceSnapshot.size,
        totalPayments: paymentsSnapshot.size,
        pendingPayments: pendingPaymentsSnapshot.size,
        recentScans: scansSnapshot.size
      });
      setLoading(false);
    } catch (error) {
      console.error("Error fetching stats:", error);
      setLoading(false);
    }
  };

  if (partnerLoading || loading) {
    return <div className="loading-text">Loading...</div>;
  }

  if (!partnerData) {
    navigate("/partner-login");
    return null;
  }

  return (
    <PartnerLayout>
      <div className="dashboard-container">
        <h1 className="dashboard-title">Analytics</h1>
        
        <div className="stats-grid">
          <StatCard
            title="Total Products"
            value={stats.totalProducts}
            icon={ShoppingBagIcon}
            color="#3b82f6"
          />
          <StatCard
            title="Total Payments"
            value={stats.totalPayments}
            icon={CurrencyDollarIcon}
            color="#10b981"
          />
          <StatCard
            title="Pending Payments"
            value={stats.pendingPayments}
            icon={ClockIcon}
            color="#f59e0b"
          />
          <StatCard
            title="Recent Scans"
            value={stats.recentScans}
            icon={QrCodeIcon}
            color="#6366f1"
          />
        </div>
      </div>
    </PartnerLayout>
  );
};

export default Analytics; 
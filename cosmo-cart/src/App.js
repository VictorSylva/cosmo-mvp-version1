import React, { useEffect } from "react";
import { analytics } from "./firebase/firebaseConfig";
import { logEvent } from "firebase/analytics";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Wallet from "./pages/Wallet";
import UserLookup from "./pages/UserLookup";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LandingPage from "./components/LandingPage/LandingPage";
import PartnerStoreDashboard from "./pages/PartnerStoreDashboard";
import PartnerStoreLogin from "./pages/PartnerStoreLogin";

const App = () => {
  useEffect(() => {
    if (analytics) {
      logEvent(analytics, "page_view"); // Track page views
    } else {
      console.warn("Analytics not initialized");
    }
  }, []);

  return (
    <Router>
      <ToastContainer />
      <Routes>
        {/* Default Route Redirects to Landing Page */}
        <Route path="/" element={<Navigate to="/landing" />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/user-lookup" element={<UserLookup />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/partner-store-dashboard" element={<PartnerStoreDashboard />} />
        <Route path="/partner-store-login" element={<PartnerStoreLogin />} />
      </Routes>
    </Router>
  );
};

export default App;

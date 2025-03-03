import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Wallet from "./pages/Wallet";
import PartnerStore from "./pages/PartnerStore";
import UserLookup from "./pages/UserLookup";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LandingPage from "./components/LandingPage/LandingPage";



const App = () => {
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
        <Route path="/partner-store" element={<PartnerStore />} />
        <Route path="/user-lookup" element={<UserLookup />} />
        <Route path="/Landing" element={<LandingPage />} />
      </Routes>
    </Router>
  );
};

export default App;

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { PartnerStoreProvider } from "./contexts/PartnerStoreContext";
import { CartProvider } from "./context/CartContext";
import PrivateRoute from "./components/PrivateRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Products from "./pages/Products";
import Wallet from "./pages/Wallet";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import PartnerStoreDashboard from "./pages/PartnerStoreDashboard";
import PartnerPayments from "./pages/Admin/PartnerPayments";
import CompletedRetrievals from "./pages/Admin/CompletedRetrievals";
import PartnerStores from "./pages/Admin/PartnerStores";
import LandingPage from "./components/LandingPage/LandingPage";
import PartnerStoreLogin from "./pages/PartnerStoreLogin";
import PartnerStoreSignup from "./pages/PartnerStoreSignup";
import ManageProducts from "./pages/PartnerStore/ManageProducts";
import PaymentHistory from "./pages/PartnerStore/PaymentHistory";
import Analytics from "./pages/PartnerStore/Analytics";
import Cart from "./pages/Cart";

function App() {
  return (
    <Router>
      <AuthProvider>
        <PartnerStoreProvider>
          <CartProvider>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/partner-login" element={<PartnerStoreLogin />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/partner/signup" element={<PartnerStoreSignup />} />
              <Route path="/products" element={<PrivateRoute><Products /></PrivateRoute>} />
              <Route path="/wallet" element={<PrivateRoute><Wallet /></PrivateRoute>} />
              <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/admin/dashboard" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
              <Route path="/admin/payments" element={<PrivateRoute><PartnerPayments /></PrivateRoute>} />
              <Route path="/admin/retrievals" element={<PrivateRoute><CompletedRetrievals /></PrivateRoute>} />
              <Route path="/admin/stores" element={<PrivateRoute><PartnerStores /></PrivateRoute>} />
              <Route path="/partner/dashboard" element={<PrivateRoute><PartnerStoreDashboard /></PrivateRoute>} />
              <Route path="/partner/manage-products" element={<PrivateRoute><ManageProducts /></PrivateRoute>} />
              <Route path="/partner/payments" element={<PrivateRoute><PaymentHistory /></PrivateRoute>} />
              <Route path="/partner/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />
              <Route path="/cart" element={<PrivateRoute><Cart /></PrivateRoute>} />
            </Routes>
          </CartProvider>
        </PartnerStoreProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

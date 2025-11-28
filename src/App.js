import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { PartnerStoreProvider } from "./contexts/PartnerStoreContext";
import { CartProvider } from "./context/CartContext";
import { SubscriptionProvider } from "./contexts/SubscriptionContext";
import PrivateRoute from "./components/PrivateRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Products from "./pages/Products";
import Wallet from "./pages/Wallet";
import NearbyStores from "./pages/NearbyStores";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import PartnerStoreDashboard from "./pages/PartnerStoreDashboard";
import PartnerPayments from "./pages/Admin/PartnerPayments";
import CompletedRetrievals from "./pages/Admin/CompletedRetrievals";
import PartnerStores from "./pages/Admin/PartnerStores";
import ProductManagement from "./pages/Admin/ProductManagement";
import InventoryOverview from "./pages/Admin/InventoryOverview";
import ManageProducts from "./pages/PartnerStore/ManageProducts";
import PaymentHistory from "./pages/PartnerStore/PaymentHistory";
import Analytics from "./pages/PartnerStore/Analytics";
import Cart from "./pages/Cart";
import LandingPage from "./pages/LandingPage";
import AuthHome from "./pages/AuthHome";
import ProductDetails from "./pages/ProductDetails";
import ToastContainer from "./components/Toast/ToastContainer";
import { ConfirmDialogContainer } from "./components/Toast/ConfirmDialog";

function App() {
  return (
    <Router>
      <AuthProvider>
        <PartnerStoreProvider>
          <CartProvider>
            <SubscriptionProvider>
              <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<AuthHome />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/products" element={<PrivateRoute><Products /></PrivateRoute>} />
              <Route path="/products/:id" element={<PrivateRoute><ProductDetails /></PrivateRoute>} />
              <Route path="/wallet" element={<PrivateRoute><Wallet /></PrivateRoute>} />
              <Route path="/nearby-stores" element={<PrivateRoute><NearbyStores /></PrivateRoute>} />
              <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/admin/dashboard" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
              <Route path="/admin/payments" element={<PrivateRoute><PartnerPayments /></PrivateRoute>} />
              <Route path="/admin/retrievals" element={<PrivateRoute><CompletedRetrievals /></PrivateRoute>} />
              <Route path="/admin/stores" element={<PrivateRoute><PartnerStores /></PrivateRoute>} />
              <Route path="/admin/products" element={<PrivateRoute><ProductManagement /></PrivateRoute>} />
              <Route path="/admin/inventory" element={<PrivateRoute><InventoryOverview /></PrivateRoute>} />
              <Route path="/partner/dashboard" element={<PrivateRoute><PartnerStoreDashboard /></PrivateRoute>} />
              <Route path="/partner/manage-products" element={<PrivateRoute><ManageProducts /></PrivateRoute>} />
              <Route path="/partner/payments" element={<PrivateRoute><PaymentHistory /></PrivateRoute>} />
              <Route path="/partner/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />
              <Route path="/cart" element={<PrivateRoute><Cart /></PrivateRoute>} />
              </Routes>
            </SubscriptionProvider>
          </CartProvider>
        </PartnerStoreProvider>
      </AuthProvider>
      <ToastContainer />
      <ConfirmDialogContainer />
    </Router>
  );
}

export default App;


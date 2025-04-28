import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { collection, getDocs, doc, getDoc, updateDoc, query, where, addDoc, deleteDoc } from "firebase/firestore";
import { db, auth } from "../firebase/firebaseConfig";
import { QrReader } from "@blackbox-vision/react-qr-reader";
import PartnerLayout from "../components/PartnerDashboard/PartnerLayout";
import { usePartnerStore } from '../contexts/PartnerStoreContext';
import '../styles/PartnerStoreDashboard.css';

const PartnerStoreDashboard = () => {
  const navigate = useNavigate();
  const { partnerData, loading: partnerLoading } = usePartnerStore();
  const [scanResult, setScanResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanError, setScanError] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [redemptionCode, setRedemptionCode] = useState("");
  const [notification, setNotification] = useState(null);

  const handleScan = async (code) => {
    if (!code || isProcessing) return;
    setIsProcessing(true);
    setScanError(null);
    setScanResult(null);

    try {
      // Get the redemption document directly by ID
      const redemptionDoc = await getDoc(doc(db, "redemptions", code));

      if (!redemptionDoc.exists()) {
        setScanError("Invalid redemption code");
        setIsProcessing(false);
        return;
      }

      const redemption = redemptionDoc.data();
      const redemptionId = redemptionDoc.id;

      // Check if already confirmed
      if (redemption.status === "confirmed") {
        setScanError("This redemption has already been confirmed");
        setIsProcessing(false);
        return;
      }

      // Check if expired (older than 24 hours)
      const redemptionTime = redemption.createdAt.toDate();
      const now = new Date();
      const hoursDiff = (now - redemptionTime) / (1000 * 60 * 60);
      if (hoursDiff > 24) {
        setScanError("This redemption code has expired");
        setIsProcessing(false);
        return;
      }

      // Get product details and partner prices for all products
      const productsDetails = await Promise.all(
        redemption.products.map(async (product) => {
          const productDoc = await getDoc(doc(db, "products", product.productId));
          if (!productDoc.exists()) {
            throw new Error(`Product ${product.productId} not found`);
          }
          
          // Get partner-specific price
          const partnerPriceDoc = await getDoc(doc(db, "partner_store_prices", `${partnerData.id}_${product.productId}`));
          const partnerPrice = partnerPriceDoc.exists() ? partnerPriceDoc.data().price : productDoc.data().price;

          return {
            ...product,
            productDetails: productDoc.data(),
            partnerPrice,
            priceDifference: partnerPrice - product.prepaidPrice
          };
        })
      );

      setScanResult({
        redemptionId,
        products: productsDetails,
        customerEmail: redemption.userName,
        totalPrepaidPrice: productsDetails.reduce((sum, p) => sum + p.prepaidPrice, 0),
        totalPartnerPrice: productsDetails.reduce((sum, p) => sum + p.partnerPrice, 0),
        totalPriceDifference: productsDetails.reduce((sum, p) => sum + p.priceDifference, 0)
      });

    } catch (error) {
      console.error("Error processing scan:", error);
      setScanError("Error processing scan: " + error.message);
    }

    setIsProcessing(false);
  };

  const handleConfirmRedemption = async (redemptionId) => {
    if (!redemptionId || !scanResult) return;
    setIsProcessing(true);

    try {
      // Get the redemption details first
      const redemptionDoc = await getDoc(doc(db, "redemptions", redemptionId));
      if (!redemptionDoc.exists()) {
        throw new Error("Redemption not found");
      }
      const redemptionData = redemptionDoc.data();

      // Remove all products from user's wallet
      await Promise.all(
        redemptionData.products.map(async (product) => {
          const walletRef = collection(db, "users", redemptionData.userId, "wallet");
          const walletQuery = query(walletRef, where("productId", "==", product.productId));
          const walletSnapshot = await getDocs(walletQuery);

          if (!walletSnapshot.empty) {
            const walletItemId = walletSnapshot.docs[0].id;
            await deleteDoc(doc(db, "users", redemptionData.userId, "wallet", walletItemId));
          }
        })
      );

      // Update redemption status
      await updateDoc(doc(db, "redemptions", redemptionId), {
        status: "confirmed",
        confirmedAt: new Date().toISOString(),
        confirmedByPartner: partnerData.id
      });

      // Create payment records for each product
      await Promise.all(
        scanResult.products.map(product => 
          addDoc(collection(db, "payments"), {
            partnerId: partnerData.id,
            redemptionId: redemptionId,
            productId: product.productId,
            productName: product.productName,
            prepaidPrice: product.prepaidPrice,
            finalPrice: product.partnerPrice,
            priceDifference: product.priceDifference,
            status: "pending",
            createdAt: new Date(),
            userId: redemptionData.userId
          })
        )
      );

      setScanResult(null);
      setRedemptionCode("");
      setScanError(null);
      alert("Redemption confirmed successfully! Items have been removed from user's wallet.");
    } catch (error) {
      console.error("Error confirming redemption:", error);
      setScanError("Error confirming redemption: " + error.message);
    }

    setIsProcessing(false);
  };

  const handleRejectRedemption = async () => {
    if (!partnerData?.id || !scanResult) return;
    setIsProcessing(true);
    
    try {
      const redemptionRef = doc(db, "redemptions", scanResult.redemptionId);
      await updateDoc(redemptionRef, { 
        status: "rejected",
        rejectedAt: new Date(),
        rejectedByPartner: partnerData.id,
        rejectionReason: "Rejected by partner store"
      });
      
      setScanResult(null);
      alert("Redemption rejected successfully.");
    } catch (error) {
      console.error("Error rejecting redemption:", error);
      setScanError("Error rejecting redemption. Please try again.");
    }
    
    setIsProcessing(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Error logging out:", error);
      setNotification("Failed to log out. Please try again.");
      setTimeout(() => setNotification(null), 3000);
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
      <div className="dashboard-container">
        {notification && (
          <div className="notification" style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: '#ff4444',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '4px',
            zIndex: 1000
          }}>
            {notification}
          </div>
        )}
        <div className="scan-section">
          <h2 className="scan-title">Quick Scan</h2>
          <div className="scan-input-container">
            <input
              type="text"
              value={redemptionCode}
              onChange={(e) => setRedemptionCode(e.target.value)}
              placeholder="Enter redemption code"
              className="scan-input"
              disabled={isProcessing}
            />
            <button
              onClick={() => handleScan(redemptionCode)}
              className="scan-button"
              disabled={!redemptionCode || isProcessing}
            >
              Process Code
            </button>
          </div>

          <button
            onClick={() => setShowScanner(!showScanner)}
            className="scan-button scan-button-green"
            style={{ marginTop: '1rem', width: '100%' }}
          >
            {showScanner ? 'Close QR Scanner' : 'Scan QR Code'}
          </button>

          {showScanner && (
            <div style={{ marginTop: '1rem' }}>
              <QrReader
                onResult={(result) => {
                  if (result) {
                    handleScan(result.text);
                    setShowScanner(false);
                  }
                }}
                constraints={{ facingMode: 'environment' }}
                style={{ width: '100%' }}
              />
            </div>
          )}

          {scanError && (
            <div className="scan-error">
              {scanError}
            </div>
          )}

          {scanResult && (
            <div className="scan-result">
              <h3 className="scan-result-title">Scan Result</h3>
              <div className="scan-result-content">
                {scanResult.products.map((product, index) => (
                  <div key={index} className="scan-result-product">
                    {product.productDetails.imageUrl && (
                      <div className="scan-result-image">
                        <img 
                          src={product.productDetails.imageUrl} 
                          alt={product.productDetails.name}
                          className="product-image"
                        />
                      </div>
                    )}
                    <div className="scan-result-grid">
                      <div>
                        <span className="scan-result-label">Product:</span>
                        <span className="scan-result-value">{product.productDetails.name}</span>
                      </div>
                      <div>
                        <span className="scan-result-label">Customer:</span>
                        <span className="scan-result-value">{scanResult.customerEmail}</span>
                      </div>
                      <div>
                        <span className="scan-result-label">Prepaid Amount:</span>
                        <span className="scan-result-value">
                          ₦{product.prepaidPrice.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="scan-result-label">Your Price:</span>
                        <span className="scan-result-value">
                          ₦{product.partnerPrice.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="scan-result-label">Difference:</span>
                        <span className={`scan-result-price-difference ${
                          product.priceDifference >= 0 ? 'positive' : 'negative'
                        }`}>
                          ₦{Math.abs(product.priceDifference).toFixed(2)}
                          {product.priceDifference >= 0 ? ' (You receive)' : ' (Customer receives)'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="scan-result-total">
                  <div>
                    <span className="total-label">Total Prepaid Amount:</span>
                    <span className="total-value">
                      ₦{scanResult.totalPrepaidPrice.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="total-label">Total Your Price:</span>
                    <span className="total-value">
                      ₦{scanResult.totalPartnerPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className={`total-difference ${
                    scanResult.totalPriceDifference >= 0 ? 'positive' : 'negative'
                  }`}>
                    <span className="total-label">Total Difference:</span>
                    <span className="total-value">
                      ₦{Math.abs(scanResult.totalPriceDifference).toFixed(2)}
                      {scanResult.totalPriceDifference >= 0 ? ' (You receive)' : ' (Customer receives)'}
                    </span>
                  </div>
                </div>
                <div className="scan-result-actions">
                  <button
                    onClick={() => handleConfirmRedemption(scanResult.redemptionId)}
                    className="scan-result-button confirm-button"
                    disabled={isProcessing}
                  >
                    Confirm Redemption
                  </button>
                  <button
                    onClick={handleRejectRedemption}
                    className="scan-result-button reject-button"
                    disabled={isProcessing}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
        >
          Logout
        </button>
      </div>
    </PartnerLayout>
  );
};

export default PartnerStoreDashboard;

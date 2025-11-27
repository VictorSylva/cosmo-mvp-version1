import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { collection, getDocs, doc, getDoc, updateDoc, query, where, addDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase/firebaseConfig";
import { QrReader } from "@blackbox-vision/react-qr-reader";
import jsQR from "jsqr";
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
  const [showUploadOption, setShowUploadOption] = useState(false);
  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

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
        totalPrepaidPrice: productsDetails.reduce((sum, p) => sum + (p.prepaidPrice * p.quantity), 0),
        totalPartnerPrice: productsDetails.reduce((sum, p) => sum + (p.partnerPrice * p.quantity), 0),
        totalPriceDifference: productsDetails.reduce((sum, p) => sum + (p.priceDifference * p.quantity), 0)
      });

    } catch (error) {
      console.error("Error processing scan:", error);
      setScanError("Error processing scan: " + error.message);
    }

    setIsProcessing(false);
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    processImageFile(file);
  };

  const processImageFile = (file) => {

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      setScanError("Please select an image file");
      return;
    }

    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setScanError("File size too large. Please select an image smaller than 10MB");
      return;
    }

    setIsProcessing(true);
    setScanError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          // Create canvas to get image data
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          // Get image data
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          // Decode QR code
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          
          if (code) {
            // Process the decoded QR code using the same logic as QR scanner
            try {
              // Parse the QR code data to extract redemptionId
              const qrData = JSON.parse(code.data);
              if (qrData.redemptionId) {
                handleScan(qrData.redemptionId);
              } else {
                setScanError("Invalid QR code format: missing redemption ID");
              }
            } catch (error) {
              // If parsing fails, try using the text directly (for backward compatibility)
              // Check if it looks like a valid redemption ID (alphanumeric, reasonable length)
              const redemptionIdPattern = /^[a-zA-Z0-9]{20,}$/;
              if (redemptionIdPattern.test(code.data)) {
                handleScan(code.data);
              } else {
                setScanError("Invalid QR code format. Please make sure you're uploading a valid redemption QR code.");
              }
            }
          } else {
            setScanError("No QR code found in the uploaded image. Please make sure the QR code is clearly visible and not blurry.");
          }
        } catch (error) {
          console.error("Error processing image:", error);
          setScanError("Error processing the image. Please try again.");
        } finally {
          setIsProcessing(false);
          // Clear the file input
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      };
      img.onerror = () => {
        setScanError("Error loading the image. Please try again.");
        setIsProcessing(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      };
      img.src = e.target.result;
    };
    reader.onerror = () => {
      setScanError("Error reading the file. Please try again.");
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
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

      // Remove products from user's wallet (handle quantities properly)
      await Promise.all(
        redemptionData.products.map(async (product) => {
          const walletRef = collection(db, "users", redemptionData.userId, "wallet");
          const walletQuery = query(walletRef, where("productId", "==", product.productId));
          const walletSnapshot = await getDocs(walletQuery);

          if (!walletSnapshot.empty) {
            // Find the aggregated wallet entry (not individual transfer entries)
            // Aggregated entries are those WITHOUT transferId (the individual transaction ID)
            let aggregatedEntry = null;
            for (const doc of walletSnapshot.docs) {
              const data = doc.data();
              if (!data.transferId) {
                aggregatedEntry = { doc, data };
                break;
              }
            }

            if (aggregatedEntry) {
              const walletData = aggregatedEntry.data;
              const currentQuantity = walletData.quantity || 1;
              const redeemQuantity = product.quantity || 1;
              const newQuantity = currentQuantity - redeemQuantity;

              if (newQuantity > 0) {
                // Update quantity if some items remain
                await updateDoc(doc(db, "users", redemptionData.userId, "wallet", aggregatedEntry.doc.id), {
                  quantity: newQuantity,
                  updatedAt: serverTimestamp()
                });
              } else {
                // Delete the wallet item if all quantities are redeemed
                await deleteDoc(doc(db, "users", redemptionData.userId, "wallet", aggregatedEntry.doc.id));
              }
            }
          }
        })
      );

      // Update redemption status
      await updateDoc(doc(db, "redemptions", redemptionId), {
        status: "confirmed",
        confirmedAt: new Date().toISOString(),
        confirmedByPartner: partnerData.id
      });

      // Create payment records for each product (account for quantities)
      await Promise.all(
        scanResult.products.map(product => 
          addDoc(collection(db, "payments"), {
            partnerID: partnerData.id,
            redemptionId: redemptionId,
            productId: product.productId,
            productName: product.productName,
            quantity: product.quantity,
            prepaidPrice: product.prepaidPrice * product.quantity, // Total prepaid amount
            finalPrice: product.partnerPrice * product.quantity, // Total final amount
            priceDifference: product.priceDifference * product.quantity, // Total difference
            unitPrepaidPrice: product.prepaidPrice, // Price per unit
            unitFinalPrice: product.partnerPrice, // Price per unit
            unitPriceDifference: product.priceDifference, // Difference per unit
            status: "pending",
            createdAt: new Date(),
            userId: redemptionData.userId
          })
        )
      );

      setScanResult(null);
      setRedemptionCode("");
      setScanError(null);
      window.showToast?.("Redemption confirmed successfully! Items have been removed from user's wallet.", 'success');
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
      window.showToast?.("Redemption rejected successfully.", 'success');
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

          <div style={{ marginTop: '1rem', display: 'flex', gap: '10px', flexDirection: 'column' }}>
            <button
              onClick={() => setShowScanner(!showScanner)}
              className="scan-button scan-button-green"
              style={{ width: '100%' }}
            >
              {showScanner ? 'Close QR Scanner' : 'Scan QR Code'}
            </button>
            
            <button
              onClick={() => setShowUploadOption(!showUploadOption)}
              className="scan-button scan-button-blue"
              style={{ width: '100%' }}
            >
              {showUploadOption ? 'Close Upload' : 'Upload QR Image'}
            </button>
          </div>

          {showScanner && (
            <div style={{ marginTop: '1rem' }}>
              <QrReader
                onResult={(result) => {
                  if (result) {
                    try {
                      // Parse the QR code data to extract redemptionId
                      const qrData = JSON.parse(result.text);
                      handleScan(qrData.redemptionId);
                    } catch (error) {
                      // If parsing fails, try using the text directly (for backward compatibility)
                      handleScan(result.text);
                    }
                    setShowScanner(false);
                  }
                }}
                constraints={{ facingMode: 'environment' }}
                style={{ width: '100%' }}
              />
            </div>
          )}

          {showUploadOption && (
            <div style={{ marginTop: '1rem' }}>
              <div 
                style={{ 
                  border: `2px dashed ${isDragOver ? '#2563eb' : '#ccc'}`, 
                  borderRadius: '8px', 
                  padding: '20px', 
                  textAlign: 'center',
                  backgroundColor: isDragOver ? '#eff6ff' : '#f9f9f9',
                  transition: 'all 0.2s ease'
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  const files = e.dataTransfer.files;
                  if (files.length > 0) {
                    processImageFile(files[0]);
                  }
                }}
              >
                <p style={{ marginBottom: '10px', color: '#666' }}>
                  {isDragOver ? 'Drop your image here' : 'Upload an image containing a QR code'}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="scan-button scan-button-blue"
                  style={{ marginRight: '10px' }}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Choose Image'}
                </button>
                <p style={{ fontSize: '12px', color: '#999', marginTop: '10px' }}>
                  Supported formats: JPG, PNG, GIF, WebP
                </p>
                <p style={{ fontSize: '11px', color: '#999', marginTop: '5px' }}>
                  Or drag and drop an image here
                </p>
              </div>
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
                        <span className="scan-result-label">Quantity:</span>
                        <span className="scan-result-value">{product.quantity}</span>
                      </div>
                      <div>
                        <span className="scan-result-label">Customer:</span>
                        <span className="scan-result-value">{scanResult.customerEmail}</span>
                      </div>
                      <div>
                        <span className="scan-result-label">Unit Prepaid Price:</span>
                        <span className="scan-result-value">
                          ₦{product.prepaidPrice.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="scan-result-label">Total Prepaid Amount:</span>
                        <span className="scan-result-value">
                          ₦{(product.prepaidPrice * product.quantity).toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="scan-result-label">Unit Your Price:</span>
                        <span className="scan-result-value">
                          ₦{product.partnerPrice.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="scan-result-label">Total Your Price:</span>
                        <span className="scan-result-value">
                          ₦{(product.partnerPrice * product.quantity).toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="scan-result-label">Unit Difference:</span>
                        <span className={`scan-result-price-difference ${
                          product.priceDifference >= 0 ? 'positive' : 'negative'
                        }`}>
                          ₦{Math.abs(product.priceDifference).toFixed(2)}
                          {product.priceDifference >= 0 ? ' (You receive)' : ' (Customer receives)'}
                        </span>
                      </div>
                      <div>
                        <span className="scan-result-label">Total Difference:</span>
                        <span className={`scan-result-price-difference ${
                          (product.priceDifference * product.quantity) >= 0 ? 'positive' : 'negative'
                        }`}>
                          ₦{Math.abs(product.priceDifference * product.quantity).toFixed(2)}
                          {(product.priceDifference * product.quantity) >= 0 ? ' (You receive)' : ' (Customer receives)'}
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

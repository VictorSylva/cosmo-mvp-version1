// src/pages/PartnerStore.js
import React, { useState } from "react";
import { QrReader } from "@blackbox-vision/react-qr-reader";
import { collection, doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

const PartnerStore = () => {
  const [scannedData, setScannedData] = useState(null);
  const [error, setError] = useState("");

  const handleScan = async (result) => {
    if (result) {
      try {
        const parsedData = JSON.parse(result); // QR code data should be JSON
        setScannedData(parsedData);
      } catch (err) {
        setError("Invalid QR code format. Please try again.");
      }
    }
  };

  const handleError = (err) => {
    setError(`QR Reader Error: ${err.message}`);
  };

  const confirmRetrieval = async () => {
    if (!scannedData) return;

    try {
      const { userId, productIds } = scannedData;

      for (const productId of productIds) {
        const productRef = doc(db, "users", userId, "wallet", productId);
        const productSnap = await getDoc(productRef);

        if (productSnap.exists()) {
          await updateDoc(productRef, { redeemed: true });
        } else {
          console.error(`Product ID ${productId} not found for user ${userId}.`);
        }
      }

      alert("Products successfully retrieved!");
      setScannedData(null); // Reset scanned data after confirmation
    } catch (err) {
      console.error("Error confirming retrieval:", err.message);
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "50px auto", textAlign: "center" }}>
      <h2>Partner Store - Scan QR Code</h2>

      <div style={{ margin: "20px 0" }}>
        <QrReader
          onResult={(result, error) => {
            if (!!result) handleScan(result?.text);
            if (!!error) handleError(error);
          }}
          constraints={{ facingMode: "environment" }}
          style={{ width: "100%" }}
        />
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {scannedData ? (
        <div style={{ marginTop: "20px", textAlign: "left" }}>
          <h3>Scanned Product Details</h3>
          <p><strong>User ID:</strong> {scannedData.userId}</p>
          <p><strong>Products:</strong></p>
          <ul>
            {scannedData.productIds.map((id, index) => (
              <li key={index}>Product ID: {id}</li>
            ))}
          </ul>
          <button
            style={{
              padding: "10px 20px",
              backgroundColor: "green",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
            onClick={confirmRetrieval}
          >
            Confirm Retrieval
          </button>
        </div>
      ) : (
        <p>Scan a QR code to view product details.</p>
      )}
    </div>
  );
};

export default PartnerStore;

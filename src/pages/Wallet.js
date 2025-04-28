import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  doc,
  deleteDoc,
  query,
  where,
  updateDoc,
  getDoc,
  onSnapshot,
} from "firebase/firestore";
import { db, auth } from "../firebase/firebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { motion } from "framer-motion";
import "../styles/Wallet.css";

const Wallet = () => {
  const [walletItems, setWalletItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [user, setUser] = useState(null);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [redemptionId, setRedemptionId] = useState(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferRecipientEmail, setTransferRecipientEmail] = useState("");
  const [transferringItem, setTransferringItem] = useState(null);
  const [showTransferHistory, setShowTransferHistory] = useState(false);
  const [selectedItemForHistory, setSelectedItemForHistory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [transferQuantity, setTransferQuantity] = useState(1);
  const [retrievalQuantities, setRetrievalQuantities] = useState({});
  const [currentPrices, setCurrentPrices] = useState({});
  const [recentRedemptions, setRecentRedemptions] = useState([]);
  const [activeTab, setActiveTab] = useState('wallet');
  const navigate = useNavigate();

  // Handle auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        navigate("/login");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Fetch wallet items
  useEffect(() => {
    const fetchWalletItems = async () => {
      if (!user) return;

      try {
        const walletRef = collection(db, "users", user.uid, "wallet");
        const walletSnapshot = await getDocs(walletRef);
        
        // Group items by productId and aggregate quantities
        const itemsMap = new Map();
        walletSnapshot.docs.forEach(doc => {
          const data = doc.data();
          const productId = data.productId;
          
          if (itemsMap.has(productId)) {
            const existingItem = itemsMap.get(productId);
            itemsMap.set(productId, {
              ...existingItem,
              quantity: (existingItem.quantity || 1) + (data.quantity || 1),
              // Keep the most recent transfer/creation info
              transferredAt: data.transferredAt || existingItem.transferredAt,
              transferredFrom: data.transferredFrom || existingItem.transferredFrom,
              transferredFromEmail: data.transferredFromEmail || existingItem.transferredFromEmail
            });
          } else {
            itemsMap.set(productId, {
              id: doc.id,
              ...data
            });
          }
        });

        const items = Array.from(itemsMap.values());
        setWalletItems(items);
      } catch (err) {
        console.error("Error fetching wallet items:", err.message);
        alert("Failed to load wallet items. Please try again.");
      }
    };

    fetchWalletItems();
  }, [user]);

  // Fetch current prices for all products in wallet
  useEffect(() => {
    const fetchCurrentPrices = async () => {
      if (!walletItems.length) return;

      try {
        const prices = {};
        for (const item of walletItems) {
          const productDoc = await getDoc(doc(db, "products", item.productId));
          if (productDoc.exists()) {
            prices[item.productId] = productDoc.data().price;
          }
        }
        setCurrentPrices(prices);
      } catch (error) {
        console.error("Error fetching current prices:", error);
      }
    };

    fetchCurrentPrices();
  }, [walletItems]);

  // Fetch recent redemptions
  useEffect(() => {
    const fetchRecentRedemptions = async () => {
      if (!user) return;

      try {
        const redemptionsRef = collection(db, "redemptions");
        const q = query(
          redemptionsRef,
          where("userId", "==", user.uid),
          where("status", "==", "confirmed")
        );
        const snapshot = await getDocs(q);
        
        const redemptions = await Promise.all(
          snapshot.docs.map(async (doc) => {
            const data = doc.data();
            const paymentsRef = collection(db, "payments");
            const paymentsQuery = query(paymentsRef, where("redemptionId", "==", doc.id));
            const paymentsSnapshot = await getDocs(paymentsQuery);
            
            const payments = paymentsSnapshot.docs.map(paymentDoc => ({
              ...paymentDoc.data(),
              id: paymentDoc.id
            }));
            
            return {
              id: doc.id,
              ...data,
              payments
            };
          })
        );
        
        setRecentRedemptions(redemptions);
      } catch (error) {
        console.error("Error fetching recent redemptions:", error);
      }
    };

    fetchRecentRedemptions();
  }, [user]);

  // Toggle item selection
  const handleSelectItem = (itemId) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
    setQrCodeData(null);
    setRedemptionId(null);
  };

  // Handle quantity change for retrieval
  const handleRetrievalQuantityChange = (itemId, quantity) => {
    setRetrievalQuantities(prev => ({
      ...prev,
      [itemId]: Math.max(1, Math.min(quantity, walletItems.find(item => item.id === itemId)?.quantity || 1))
    }));
  };

  // Add transfer function
  const handleTransfer = async () => {
    if (!user) {
      alert("Please log in to transfer items");
      return;
    }

    if (!transferringItem || !transferRecipientEmail) {
      alert("Please select a recipient");
      return;
    }

    try {
      // Find recipient's user ID
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", transferRecipientEmail));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        alert("Recipient not found");
        return;
      }

      const recipientDoc = querySnapshot.docs[0];
      const recipientId = recipientDoc.id;

      const quantityToTransfer = Math.min(transferQuantity, transferringItem.quantity || 1);

      // Check if recipient already has this product
      const recipientWalletRef = collection(db, "users", recipientId, "wallet");
      const recipientQuery = query(recipientWalletRef, where("productId", "==", transferringItem.productId));
      const recipientQuerySnapshot = await getDocs(recipientQuery);

      if (!recipientQuerySnapshot.empty) {
        // Update existing product quantity
        const existingDoc = recipientQuerySnapshot.docs[0];
        const existingData = existingDoc.data();
        const currentQuantity = existingData.quantity || 1;
        
        await updateDoc(doc(db, "users", recipientId, "wallet", existingDoc.id), {
          quantity: currentQuantity + quantityToTransfer,
          updatedAt: serverTimestamp(),
          transferredAt: serverTimestamp(),
          transferredFrom: user.uid,
          transferredFromEmail: user.email
        });
      } else {
        // Add new product to recipient's wallet
        await addDoc(recipientWalletRef, {
          productId: transferringItem.productId,
          productName: transferringItem.productName,
          productPrice: transferringItem.productPrice,
          imageUrl: transferringItem.imageUrl,
          quantity: quantityToTransfer,
          transferredAt: serverTimestamp(),
          transferredFrom: user.uid,
          transferredFromEmail: user.email,
          status: 'active'
        });
      }

      // Update sender's wallet
      const senderWalletRef = collection(db, "users", user.uid, "wallet");
      const senderQuery = query(senderWalletRef, where("productId", "==", transferringItem.productId));
      const senderQuerySnapshot = await getDocs(senderQuery);

      if (!senderQuerySnapshot.empty) {
        const senderDoc = senderQuerySnapshot.docs[0];
        const senderData = senderDoc.data();
        const newQuantity = senderData.quantity - quantityToTransfer;

        if (newQuantity > 0) {
          await updateDoc(doc(db, "users", user.uid, "wallet", senderDoc.id), {
            quantity: newQuantity,
            updatedAt: serverTimestamp()
          });
        } else {
          await deleteDoc(doc(db, "users", user.uid, "wallet", senderDoc.id));
        }
      }

      // Update wallet items state
      setWalletItems(prevItems => {
        return prevItems.map(item => {
          if (item.productId === transferringItem.productId) {
            const newQuantity = item.quantity - quantityToTransfer;
            if (newQuantity > 0) {
              return { ...item, quantity: newQuantity };
            }
            return null;
          }
          return item;
        }).filter(Boolean);
      });

      closeTransferModal();
      alert("Transfer successful!");
    } catch (error) {
      console.error("Error transferring item:", error);
      alert("Failed to transfer item. Please try again.");
    }
  };

  // Generate QR code
  const generateQrCode = async () => {
    if (!user) {
      alert("Please log in to generate QR code");
      return;
    }

    if (selectedItems.length === 0) {
      alert("Please select at least one item to retrieve.");
      return;
    }

    try {
      const selectedProducts = walletItems.filter((item) =>
        selectedItems.includes(item.id)
      ).map(item => {
        const selectedQuantity = retrievalQuantities[item.id] || 1;
        return {
          productId: item.productId,
          productName: item.productName,
          prepaidPrice: item.productPrice,
          imageUrl: item.imageUrl,
          quantity: selectedQuantity,
          totalQuantity: item.quantity
        };
      });

      // Create a redemption record
      const redemptionRef = collection(db, "redemptions");
      const redemptionDoc = await addDoc(redemptionRef, {
        userId: user.uid,
        userName: user.email,
        products: selectedProducts,
        status: "pending",
        createdAt: serverTimestamp()
      });

      // Generate QR code data with redemption ID
      const qrData = {
        redemptionId: redemptionDoc.id,
        userId: user.uid,
        products: selectedProducts.map((item) => ({
          id: item.productId,
          name: item.productName,
          price: item.prepaidPrice,
          quantity: item.quantity,
          totalQuantity: item.totalQuantity
        })),
      };

      setRedemptionId(redemptionDoc.id);
      setQrCodeData(JSON.stringify(qrData));
      
      // Don't clear selections or quantities yet
      // They will be cleared when the redemption is confirmed
    } catch (error) {
      console.error("Error generating QR code:", error);
      alert("Failed to generate QR code. Please try again.");
    }
  };

  // Add a function to listen for redemption status changes
  useEffect(() => {
    if (!redemptionId || !user) return;

    const redemptionRef = doc(db, "redemptions", redemptionId);
    const unsubscribe = onSnapshot(redemptionRef, (doc) => {
      if (doc.exists()) {
        const redemptionData = doc.data();
        if (redemptionData.status === "completed") {
          // Update wallet quantities after confirmation
          const updateWalletQuantities = async () => {
            try {
              for (const product of redemptionData.products) {
                const walletRef = doc(db, "users", user.uid, "wallet", product.productId);
                const walletDoc = await getDoc(walletRef);
                
                if (walletDoc.exists()) {
                  const currentQuantity = walletDoc.data().quantity || 1;
                  const redeemedQuantity = product.quantity;
                  const newQuantity = currentQuantity - redeemedQuantity;
                  
                  if (newQuantity > 0) {
                    await updateDoc(walletRef, {
                      quantity: newQuantity
                    });
                    
                    setWalletItems(prevItems => prevItems.map(walletItem => {
                      if (walletItem.id === product.productId) {
                        return { ...walletItem, quantity: newQuantity };
                      }
                      return walletItem;
                    }));
                  } else {
                    await deleteDoc(walletRef);
                    setWalletItems(prevItems => prevItems.filter(walletItem => walletItem.id !== product.productId));
                  }
                }
              }
              
              // Clear selections and quantities after successful redemption
              setSelectedItems([]);
              setRetrievalQuantities({});
              setRedemptionId(null);
              setQrCodeData(null);
            } catch (error) {
              console.error("Error updating wallet quantities:", error);
            }
          };

          updateWalletQuantities();
        }
      }
    });

    return () => unsubscribe();
  }, [redemptionId, user]);

  // Open transfer modal
  const openTransferModal = (item) => {
    setTransferringItem(item);
    setTransferRecipientEmail("");
    setTransferQuantity(1);
    setShowTransferModal(true);
  };

  // Close transfer modal
  const closeTransferModal = () => {
    setShowTransferModal(false);
    setTransferringItem(null);
    setTransferRecipientEmail("");
  };

  // Open transfer history modal
  const openTransferHistory = (item) => {
    setSelectedItemForHistory(item);
    setShowTransferHistory(true);
  };

  // Close transfer history modal
  const closeTransferHistory = () => {
    setShowTransferHistory(false);
    setSelectedItemForHistory(null);
  };

  // Search for users
  const searchUsers = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const usersRef = collection(db, "users");
      // Search by email
      const emailQuery = query(usersRef, where("email", ">=", query), where("email", "<=", query + "\uf8ff"));
      const emailSnapshot = await getDocs(emailQuery);
      
      // Search by display name
      const nameQuery = query(usersRef, where("displayName", ">=", query), where("displayName", "<=", query + "\uf8ff"));
      const nameSnapshot = await getDocs(nameQuery);
      
      // Combine results and remove duplicates
      const results = [];
      const addedIds = new Set();
      
      [...emailSnapshot.docs, ...nameSnapshot.docs].forEach(doc => {
        if (!addedIds.has(doc.id) && doc.id !== user.uid) {
          addedIds.add(doc.id);
          results.push({
            id: doc.id,
            email: doc.data().email,
            displayName: doc.data().displayName || doc.data().email
          });
        }
      });
      
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchUsers(query);
  };

  // Select recipient from search results
  const selectRecipient = (recipient) => {
    setTransferRecipientEmail(recipient.email);
    setSearchResults([]);
  };

  // Calculate total value of wallet items
  const calculateTotalValue = () => {
    return walletItems.reduce((total, item) => {
      const itemPrice = parseFloat(item.productPrice) || 0;
      const itemQuantity = item.quantity || 1;
      return total + (itemPrice * itemQuantity);
    }, 0);
  };

  // Calculate savings for a product
  const calculateSavings = (item) => {
    const currentPrice = currentPrices[item.productId] || item.productPrice;
    const prepaidPrice = item.productPrice;
    const quantity = retrievalQuantities[item.id] || 1;
    const savings = (currentPrice - prepaidPrice) * quantity;
    return savings > 0 ? savings : 0;
  };

  // Calculate total savings for selected items
  const calculateTotalSavings = () => {
    return recentRedemptions.reduce((total, redemption) => {
      return total + redemption.payments.reduce((sum, payment) => {
        return sum + (payment.priceDifference || 0);
      }, 0);
    }, 0);
  };

  // Calculate total savings from all redemptions
  const calculateTotalSavingsFromAllRedemptions = () => {
    return recentRedemptions.reduce((total, redemption) => {
      return total + redemption.payments.reduce((sum, payment) => {
        return sum + (payment.priceDifference || 0);
      }, 0);
    }, 0);
  };

  // Calculate total items redeemed
  const calculateTotalItemsRedeemed = () => {
    return recentRedemptions.reduce((total, redemption) => {
      return total + redemption.payments.length;
    }, 0);
  };

  // Calculate savings for selected items
  const calculateSelectedItemsSavings = () => {
    return selectedItems.reduce((total, itemId) => {
      const item = walletItems.find(item => item.id === itemId);
      if (item) {
        const currentPrice = currentPrices[item.productId] || item.productPrice;
        const prepaidPrice = item.productPrice;
        const quantity = retrievalQuantities[item.id] || 1;
        return total + ((currentPrice - prepaidPrice) * quantity);
      }
      return total;
    }, 0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="wallet-container"
    >
      <div className="wallet-header">
        <h2 className="wallet-title">My Wallet</h2>
      </div>

      {/* Stats Summary */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <h3 className="stat-title">Wallet Value</h3>
          <p className="stat-value">₦{calculateTotalValue().toFixed(2)}</p>
        </div>
        <div className="stat-card green">
          <h3 className="stat-title">Total Savings</h3>
          <p className="stat-value">₦{calculateTotalSavings().toFixed(2)}</p>
        </div>
        <div className="stat-card yellow">
          <h3 className="stat-title">Items Redeemed</h3>
          <p className="stat-value">{calculateTotalItemsRedeemed()}</p>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="nav-tabs">
        <button
          onClick={() => setActiveTab('wallet')}
          className={`nav-tab ${activeTab === 'wallet' ? 'active' : ''}`}
        >
          My Wallet
        </button>
        <button
          onClick={() => setActiveTab('redemptions')}
          className={`nav-tab ${activeTab === 'redemptions' ? 'active' : ''}`}
        >
          Redemption History
        </button>
        <button
          onClick={() => navigate("/products")}
          className="back-button"
        >
          Back to Products
        </button>
      </div>

      {/* Wallet Tab Content */}
      {activeTab === 'wallet' && (
        <>
          {selectedItems.length > 0 && (
            <div className="stat-card green">
              <p className="stat-title">
                Total Savings on Selected Items: ₦{calculateSelectedItemsSavings().toFixed(2)}
              </p>
            </div>
          )}
          
          {walletItems.length === 0 ? (
            <p>You have no prepaid items in your wallet.</p>
          ) : (
            <>
              <div className="wallet-items-grid">
                {walletItems.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="wallet-item-card"
                  >
                    <img
                      src={item.imageUrl || "https://via.placeholder.com/150"}
                      alt={item.productName}
                      className="wallet-item-image"
                    />
                    <h3 className="wallet-item-name">{item.productName}</h3>
                    <p className="wallet-item-price">Prepaid Price: ₦{item.productPrice}</p>
                    {currentPrices[item.productId] && (
                      <p className="wallet-item-price">Current Price: ₦{currentPrices[item.productId]}</p>
                    )}
                    <p className="wallet-item-quantity">Quantity: {item.quantity || 1}</p>
                    {selectedItems.includes(item.id) && (
                      <div>
                        <label>
                          Quantity to retrieve:
                          <input
                            type="number"
                            min="1"
                            max={item.quantity || 1}
                            value={retrievalQuantities[item.id] || 1}
                            onChange={(e) => handleRetrievalQuantityChange(item.id, parseInt(e.target.value))}
                            className="quantity-input"
                          />
                        </label>
                        {calculateSelectedItemsSavings() > 0 && (
                          <p className="savings-badge">
                            Savings: ₦{calculateSelectedItemsSavings().toFixed(2)}
                          </p>
                        )}
                      </div>
                    )}
                    <label>
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => handleSelectItem(item.id)}
                        className="select-checkbox"
                      />
                      Select for Retrieval
                    </label>
                    <button
                      onClick={() => openTransferModal(item)}
                      className="transfer-button"
                    >
                      Transfer
                    </button>
                  </motion.div>
                ))}
              </div>
              
              {selectedItems.length > 0 && (
                <div className="qr-section">
                  <button
                    onClick={generateQrCode}
                    className="transfer-button"
                    style={{ maxWidth: '200px' }}
                  >
                    Generate QR Code
                  </button>
                </div>
              )}

              {qrCodeData && (
                <div className="qr-section">
                  <div className="qr-container">
                    <QRCodeSVG value={qrCodeData} size={200} />
                  </div>
                  <div className="redemption-id-container">
                    <p>Redemption ID for Manual Entry:</p>
                    <div>
                      <input
                        type="text"
                        value={redemptionId}
                        readOnly
                        className="redemption-id-input"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(redemptionId);
                          alert("Redemption ID copied to clipboard!");
                        }}
                        className="copy-button"
                      >
                        Copy ID
                      </button>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      You can use this ID for manual retrieval at partner stores
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Redemptions Tab Content */}
      {activeTab === 'redemptions' && (
        <div className="redemption-history">
          {recentRedemptions.length === 0 ? (
            <p className="text-gray-500">No redemption history available.</p>
          ) : (
            recentRedemptions.map((redemption) => (
              <div key={redemption.id} className="redemption-card">
                <div className="flex justify-between items-center">
                  <p className="redemption-date">
                    Redeemed on: {new Date(redemption.confirmedAt).toLocaleString()}
                  </p>
                  <p className="redemption-savings">
                    Total Saved: ₦{redemption.payments.reduce((sum, payment) => sum + payment.priceDifference, 0).toFixed(2)}
                  </p>
                </div>
                <div className="redemption-items-grid">
                  {redemption.payments.map((payment) => (
                    <div key={payment.id} className="redemption-item">
                      <p className="redemption-item-name">{payment.productName}</p>
                      <div className="price-row">
                        <span>Prepaid Price:</span>
                        <span>₦{payment.prepaidPrice}</span>
                      </div>
                      <div className="price-row">
                        <span>Store Price:</span>
                        <span>₦{payment.finalPrice}</span>
                      </div>
                      <div className="savings-row">
                        <span>You Saved:</span>
                        <span>₦{payment.priceDifference.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Transfer Item</h3>
            <div className="modal-body">
              <div className="transfer-item-info">
                <img
                  src={transferringItem?.imageUrl || "https://via.placeholder.com/150"}
                  alt={transferringItem?.productName}
                  className="transfer-item-image"
                />
                <div>
                  <h4>{transferringItem?.productName}</h4>
                  <p>Price: ₦{transferringItem?.productPrice}</p>
                  <p>Available Quantity: {transferringItem?.quantity || 1}</p>
                </div>
              </div>

              <div className="transfer-form">
                <div className="form-group">
                  <label>Recipient Email</label>
                  <input
                    type="email"
                    value={transferRecipientEmail}
                    onChange={(e) => setTransferRecipientEmail(e.target.value)}
                    placeholder="Enter recipient's email"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Quantity to Transfer</label>
                  <input
                    type="number"
                    min="1"
                    max={transferringItem?.quantity || 1}
                    value={transferQuantity}
                    onChange={(e) => setTransferQuantity(parseInt(e.target.value))}
                    className="form-input"
                  />
                </div>

                {searchResults.length > 0 && (
                  <div className="search-results">
                    {searchResults.map((result) => (
                      <div
                        key={result.id}
                        className="search-result-item"
                        onClick={() => selectRecipient(result)}
                      >
                        <p>{result.displayName}</p>
                        <p className="email">{result.email}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button
                onClick={closeTransferModal}
                className="modal-button cancel"
              >
                Cancel
              </button>
              <button
                onClick={handleTransfer}
                className="modal-button confirm"
                disabled={!transferRecipientEmail || !transferQuantity}
              >
                Transfer
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Wallet;

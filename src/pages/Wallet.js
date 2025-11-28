import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  doc,
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
import { useSubscription } from "../contexts/SubscriptionContext";
import SubscriptionPlans from "../components/SubscriptionPlans";
import TransferNotification from "../components/TransferNotification";
import NotificationIcon from "../components/NotificationIcon";
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
  const [notification, setNotification] = useState(null);
  const [transferHistory, setTransferHistory] = useState([]);
  const [receiveHistory, setReceiveHistory] = useState([]);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [transferNotifications, setTransferNotifications] = useState([]);
  const [lastTransferCount, setLastTransferCount] = useState(0);
  const [seenTransferIds, setSeenTransferIds] = useState(new Set());
  const [notificationCount, setNotificationCount] = useState(0);
  const [isNotificationIconOpen, setIsNotificationIconOpen] = useState(false);
  const [usePolling, setUsePolling] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const navigate = useNavigate();
  const { getSubscriptionInfo } = useSubscription();

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

  // Subscribe to wallet updates (items, received list, sent history)
  useEffect(() => {
    if (!user) return;

    const walletRef = collection(db, "users", user.uid, "wallet");
    let prevReceivedCount = 0;

    const unsubscribe = onSnapshot(walletRef, (walletSnapshot) => {
      try {
        const itemsMap = new Map();
        const received = [];
        const sent = [];

        walletSnapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data();
          const productId = data.productId;

          if (data.transferredFrom === user.uid && data.transferType === 'sent') {
            sent.push({ ...data, id: docSnapshot.id });
          }

          // Skip sent items from wallet display
          if (data.status === 'sent') return;

          // Collect received items
          if (
            data.transferId &&
            data.transferredFrom &&
            data.transferredFrom !== user.uid &&
            data.status === "active" &&
            data.transferType === "received"
          ) {
            received.push({ ...data, id: docSnapshot.id });
          }

          if (itemsMap.has(productId)) {
            const existingItem = itemsMap.get(productId);
            itemsMap.set(productId, {
              ...existingItem,
              quantity: (existingItem.quantity || 1) + (data.quantity || 1),
              transferredAt: data.transferredAt || existingItem.transferredAt,
              transferredFrom: data.transferredFrom || existingItem.transferredFrom,
              transferredFromEmail:
                data.transferredFromEmail || existingItem.transferredFromEmail,
            });
          } else {
            itemsMap.set(productId, {
              id: docSnapshot.id,
              ...data,
            });
          }
        });

        const items = Array.from(itemsMap.values());
        setWalletItems(items);
        setReceiveHistory(received);
        setTransferHistory(sent);

        if (prevReceivedCount && received.length > prevReceivedCount) {
          setNotification("You have received a new product!");
          setTimeout(() => setNotification(null), 3000);
        }
        prevReceivedCount = received.length;
      } catch (err) {
        console.error("Error processing wallet snapshot:", err);
        alert("Failed to load wallet items. Please try again.");
      }
    }, (error) => {
      console.error("Error listening to wallet updates:", error);
    });

    return () => unsubscribe();
  }, [user]);

  // Real-time listener for transfer notifications (simplified)
  useEffect(() => {
    if (!user) return;

    const walletRef = collection(db, "users", user.uid, "wallet");
    const receivedQuery = query(
      walletRef, 
      where("transferType", "==", "received")
    );

    const unsubscribe = onSnapshot(receivedQuery, (snapshot) => {
      try {
        const receivedTransfers = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Sort by timestamp locally to avoid Firestore orderBy issues
        receivedTransfers.sort((a, b) => {
          const timeA = a.transferredAt?.seconds || 0;
          const timeB = b.transferredAt?.seconds || 0;
          return timeB - timeA;
        });

        // Initialize seen transfers on first load
        if (lastTransferCount === 0) {
          const initialSeenIds = new Set(receivedTransfers.map(t => t.id));
          setSeenTransferIds(initialSeenIds);
          setLastTransferCount(receivedTransfers.length);
          return;
        }

        // Check for new transfers that haven't been seen
        const newTransfers = receivedTransfers.filter(transfer => 
          !seenTransferIds.has(transfer.id)
        );
        
        if (newTransfers.length > 0) {
          newTransfers.forEach(transfer => {
            // Only show notification if it's a very recent transfer (within last 2 minutes)
            const transferTime = transfer.transferredAt?.seconds * 1000 || Date.now();
            const twoMinutesAgo = Date.now() - (2 * 60 * 1000);
            
            if (transferTime > twoMinutesAgo) {
              const notification = {
                id: `notification_${transfer.id}_${Date.now()}`,
                productName: transfer.productName,
                quantity: transfer.quantity,
                senderEmail: transfer.transferredFromEmail,
                timestamp: transfer.transferredAt
              };
              
              setTransferNotifications(prev => [...prev, notification]);
              setNotificationCount(prev => prev + 1);
            }
          });
          
          // Mark these transfers as seen
          const newSeenIds = new Set(newTransfers.map(t => t.id));
          setSeenTransferIds(prev => new Set([...prev, ...newSeenIds]));
        }
        
        setLastTransferCount(receivedTransfers.length);
      } catch (error) {
        console.error("Error processing transfer notifications:", error);
      }
    }, (error) => {
      console.error("Error listening to transfer notifications:", error);
      // Switch to polling if real-time listener fails
      setUsePolling(true);
    });

    return () => {
      try {
        unsubscribe();
      } catch (error) {
        console.error("Error unsubscribing from transfer notifications:", error);
        // Switch to polling if real-time fails
        setUsePolling(true);
      }
    };
  }, [user, lastTransferCount, seenTransferIds]);

  // Fallback polling mechanism for notifications
  useEffect(() => {
    if (!user || !usePolling) return;

    const checkForNewTransfers = async () => {
      try {
        const walletRef = collection(db, "users", user.uid, "wallet");
        const receivedQuery = query(
          walletRef, 
          where("transferType", "==", "received")
        );
        
        const snapshot = await getDocs(receivedQuery);
        const receivedTransfers = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Sort by timestamp
        receivedTransfers.sort((a, b) => {
          const timeA = a.transferredAt?.seconds || 0;
          const timeB = b.transferredAt?.seconds || 0;
          return timeB - timeA;
        });

        // Check for new transfers
        const newTransfers = receivedTransfers.filter(transfer => 
          !seenTransferIds.has(transfer.id)
        );
        
        if (newTransfers.length > 0) {
          newTransfers.forEach(transfer => {
            const transferTime = transfer.transferredAt?.seconds * 1000 || Date.now();
            const twoMinutesAgo = Date.now() - (2 * 60 * 1000);
            
            if (transferTime > twoMinutesAgo) {
              const notification = {
                id: `notification_${transfer.id}_${Date.now()}`,
                productName: transfer.productName,
                quantity: transfer.quantity,
                senderEmail: transfer.transferredFromEmail,
                timestamp: transfer.transferredAt
              };
              
              setTransferNotifications(prev => [...prev, notification]);
              setNotificationCount(prev => prev + 1);
            }
          });
          
          const newSeenIds = new Set(newTransfers.map(t => t.id));
          setSeenTransferIds(prev => new Set([...prev, ...newSeenIds]));
        }
        
        setLastTransferCount(receivedTransfers.length);
      } catch (error) {
        console.error("Error polling for transfer notifications:", error);
      }
    };

    // Poll every 10 seconds
    const interval = setInterval(checkForNewTransfers, 10000);
    
    // Initial check
    checkForNewTransfers();

    return () => clearInterval(interval);
  }, [user, usePolling, seenTransferIds, lastTransferCount]);

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
        
          // Sort redemptions by confirmedAt date (most recent first)
          const sortedRedemptions = redemptions.sort((a, b) => {
            const dateA = a.confirmedAt?.seconds || 0;
            const dateB = b.confirmedAt?.seconds || 0;
            return dateB - dateA; // Most recent first
          });
          
          setRecentRedemptions(sortedRedemptions);
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
      setIsTransferring(true);
      const recipientEmail = transferRecipientEmail.trim();
      
      // Find recipient's user ID
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", recipientEmail));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        window.showToast?.("Recipient not found", "error");
        setIsTransferring(false);
        return;
      }

      const recipientDoc = querySnapshot.docs[0];
      const recipientId = recipientDoc.id;

      const quantityToTransfer = Math.min(transferQuantity, transferringItem.quantity || 1);

      // Generate unique transfer ID for this transaction
      const transferId = `transfer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const transferTimestamp = serverTimestamp();

      // Always create a separate wallet entry for each transfer to track individual transactions
      // This is allowed by firestore rules (create permission)
      const recipientWalletRef = collection(db, "users", recipientId, "wallet");
      await addDoc(recipientWalletRef, {
        productId: transferringItem.productId,
        productName: transferringItem.productName,
        productPrice: transferringItem.productPrice,
        imageUrl: transferringItem.imageUrl,
        quantity: quantityToTransfer,
        transferredAt: transferTimestamp,
        transferredFrom: user.uid,
        transferredFromEmail: user.email,
        transferId: transferId, // Link to the transfer transaction
        status: 'active',
        transferType: 'received' // Mark as received transfer
      });

      // REMOVED: Attempt to update aggregated wallet entry
      // This was causing the hang because users cannot UPDATE other users' documents
      // We now rely on client-side aggregation in fetchWalletItems

      // Update sender's wallet
      const senderWalletRef = collection(db, "users", user.uid, "wallet");
      const senderQuery = query(senderWalletRef, where("productId", "==", transferringItem.productId));
      const senderQuerySnapshot = await getDocs(senderQuery);

      if (!senderQuerySnapshot.empty) {
        let remainingToTransfer = quantityToTransfer;

        for (const docSnapshot of senderQuerySnapshot.docs) {
          if (remainingToTransfer <= 0) break;

          const data = docSnapshot.data();
          // Skip 'sent' items or items that are not active
          if (data.status === 'sent' || (data.status && data.status !== 'active')) continue;

          const currentQty = data.quantity || 0;
          if (currentQty <= 0) continue;

          const docRef = doc(db, "users", user.uid, "wallet", docSnapshot.id);

          if (currentQty > remainingToTransfer) {
            // This doc has enough to cover the rest
            await updateDoc(docRef, {
              quantity: currentQty - remainingToTransfer,
              status: 'active',
              updatedAt: transferTimestamp
            });
            remainingToTransfer = 0;
          } else {
            // Mark as sent instead of deleting to avoid permission issues
            await updateDoc(docRef, {
              quantity: 0,
              status: 'sent',
              updatedAt: transferTimestamp
            });
            remainingToTransfer -= currentQty;
          }
        }

        
        // Log transfer event in sender's wallet for history with unique transfer ID
        await addDoc(senderWalletRef, {
          productId: transferringItem.productId,
          productName: transferringItem.productName,
          productPrice: transferringItem.productPrice,
          imageUrl: transferringItem.imageUrl,
          quantity: quantityToTransfer,
          transferredAt: transferTimestamp,

          transferredToEmail: recipientEmail,
          transferredTo: recipientId,
          transferredFrom: user.uid,
          transferId: transferId, // Unique transfer transaction ID
          transferType: 'sent', // Mark as sent transfer
          status: 'sent',
        });
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
      window.showToast?.("Transfer successful!", "success");
    } catch (error) {
      console.error("Error transferring item:", error);
      window.showToast?.("Failed to transfer item. Please try again.", "error");
    } finally {
      setIsTransferring(false);
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

  // Listen for redemption status changes and refresh wallet data
  useEffect(() => {
    if (!redemptionId || !user) return;

    const redemptionRef = doc(db, "redemptions", redemptionId);
    const unsubscribe = onSnapshot(redemptionRef, (doc) => {
      if (doc.exists()) {
        const redemptionData = doc.data();
        if (redemptionData.status === "confirmed") {
          // Clear selections and quantities after successful redemption
          setSelectedItems([]);
          setRetrievalQuantities({});
          setRedemptionId(null);
          setQrCodeData(null);
          
          // Refresh wallet data to reflect the changes made by PartnerStoreDashboard
          const refreshWallet = async () => {
            try {
                const walletRef = collection(db, "users", user.uid, "wallet");
              const walletSnapshot = await getDocs(walletRef);
              const itemsMap = new Map();
              let received = [];
              
              walletSnapshot.docs.forEach(doc => {
                const data = doc.data();
                const productId = data.productId;
                
                // Collect received items first - only from individual transfer entries with transferId
                if (data.transferId && data.transferredFrom && data.transferredFrom !== user.uid && data.status === 'active' && data.transferType === 'received') {
                  received.push({ ...data, id: doc.id });
                }
                
                // Aggregate wallet items for display - exclude individual transfer history entries
                // Include: original purchases and aggregated entries (those without transferId)
                if (!data.transferId) {
                  if (itemsMap.has(productId)) {
                    const existingItem = itemsMap.get(productId);
                    itemsMap.set(productId, {
                      ...existingItem,
                      quantity: (existingItem.quantity || 1) + (data.quantity || 1),
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
                }
              });
              
              const items = Array.from(itemsMap.values());
              setWalletItems(items);
              setReceiveHistory(received);
            } catch (error) {
              console.error("Error refreshing wallet after redemption:", error);
            }
          };

          refreshWallet();
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
    setSearchQuery(""); // Clear search query as well
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

  // Handle notification dismissal
  const handleNotificationDismiss = (notificationId) => {
    setTransferNotifications(prev => prev.filter(n => n.id !== notificationId));
    setNotificationCount(prev => Math.max(0, prev - 1));
  };

  // Handle notification icon toggle
  const handleNotificationIconToggle = () => {
    setIsNotificationIconOpen(prev => {
      const nextState = !prev;
      if (!prev && notificationCount > 0) {
        setNotificationCount(0);
        setTransferNotifications([]);
      }
      return nextState;
    });
  };

  // Manual refresh for notifications (fallback)
  const refreshNotifications = async () => {
    if (!user) return;
    
    try {
      const walletRef = collection(db, "users", user.uid, "wallet");
      const receivedQuery = query(
        walletRef, 
        where("transferType", "==", "received")
      );
      
      const snapshot = await getDocs(receivedQuery);
      const receivedTransfers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort by timestamp
      receivedTransfers.sort((a, b) => {
        const timeA = a.transferredAt?.seconds || 0;
        const timeB = b.transferredAt?.seconds || 0;
        return timeB - timeA;
      });

      // Check for new transfers
      const newTransfers = receivedTransfers.filter(transfer => 
        !seenTransferIds.has(transfer.id)
      );
      
      if (newTransfers.length > 0) {
        newTransfers.forEach(transfer => {
          const transferTime = transfer.transferredAt?.seconds * 1000 || Date.now();
          const twoMinutesAgo = Date.now() - (2 * 60 * 1000);
          
          if (transferTime > twoMinutesAgo) {
            const notification = {
              id: `notification_${transfer.id}_${Date.now()}`,
              productName: transfer.productName,
              quantity: transfer.quantity,
              senderEmail: transfer.transferredFromEmail,
              timestamp: transfer.transferredAt
            };
            
            setTransferNotifications(prev => [...prev, notification]);
            setNotificationCount(prev => prev + 1);
          }
        });
        
        const newSeenIds = new Set(newTransfers.map(t => t.id));
        setSeenTransferIds(prev => new Set([...prev, ...newSeenIds]));
      }
      
      setLastTransferCount(receivedTransfers.length);
    } catch (error) {
      console.error("Error refreshing notifications:", error);
    }
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
      {notification && (
        <div className="notification">{notification}</div>
      )}
      
      {/* Fixed Notification Icon */}
      <NotificationIcon 
        notificationCount={notificationCount}
        onToggle={handleNotificationIconToggle}
        isOpen={isNotificationIconOpen}
        onRefresh={refreshNotifications}
      />
      
      {/* Transfer Notifications */}
      <TransferNotification 
        notifications={transferNotifications}
        onDismiss={handleNotificationDismiss}
      />
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

      {/* Subscription Status */}
      <div className="subscription-status">
        {(() => {
          const subscriptionInfo = getSubscriptionInfo();
          const totalItems = walletItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
          
          return (
            <div className={`subscription-card ${subscriptionInfo?.isActive ? 'active' : 'inactive'}`}>
              <div className="subscription-info">
                <h3>Storage Plan</h3>
                <p className="plan-status">
                  {subscriptionInfo?.isActive ? (
                    <>
                      <span className="plan-name">{subscriptionInfo.plan.charAt(0).toUpperCase() + subscriptionInfo.plan.slice(1)} Plan</span>
                      <span className="plan-days">({subscriptionInfo.daysRemaining} days remaining)</span>
                    </>
                  ) : (
                    <span className="plan-name">Free Plan (1 item limit)</span>
                  )}
                </p>
                <p className="storage-info">
                  {totalItems} items stored
                  {!subscriptionInfo?.isActive && totalItems >= 1 && (
                    <span className="limit-warning"> - Limit reached!</span>
                  )}
                </p>
              </div>
              {!subscriptionInfo?.isActive && (
                <button 
                  className="upgrade-button"
                  onClick={() => setShowSubscriptionModal(true)}
                >
                  Upgrade Now
                </button>
              )}
            </div>
          );
        })()}
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
          onClick={() => setActiveTab('transfers')}
          className={`nav-tab ${activeTab === 'transfers' ? 'active' : ''}`}
        >
          Transfer History
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
                          window.showToast?.("Redemption ID copied to clipboard!", 'success');
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
                    onChange={(e) => {
                      setTransferRecipientEmail(e.target.value);
                      handleSearchChange(e);
                    }}
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
                disabled={!transferRecipientEmail || !transferQuantity || isTransferring}
              >
                {isTransferring ? "Transferring..." : "Transfer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer History Tab Content */}
      {activeTab === 'transfers' && (
        <div className="transfer-history">
          <h3>Received Products</h3>
          {receiveHistory.length === 0 ? (
            <p>No products received yet.</p>
          ) : (
            <ul>
              {receiveHistory
                .sort((a, b) => {
                  // Sort by transfer timestamp, most recent first
                  const timeA = a.transferredAt ? a.transferredAt.seconds : 0;
                  const timeB = b.transferredAt ? b.transferredAt.seconds : 0;
                  return timeB - timeA;
                })
                .map((item, index) => (
                <li key={`received-${item.transferId || item.id}-${index}`}>
                  Received {item.productName} (Qty: {item.quantity}) from {item.transferredFromEmail || 'Unknown'} on {item.transferredAt ? new Date(item.transferredAt.seconds * 1000).toLocaleString() : 'Unknown'}
                </li>
              ))}
            </ul>
          )}
          <h3>Sent Products</h3>
          {transferHistory.length === 0 ? (
            <p>No products sent yet.</p>
          ) : (
            <ul>
              {transferHistory
                .sort((a, b) => {
                  // Sort by transfer timestamp, most recent first
                  const timeA = a.transferredAt ? a.transferredAt.seconds : 0;
                  const timeB = b.transferredAt ? b.transferredAt.seconds : 0;
                  return timeB - timeA;
                })
                .map((item, index) => (
                <li key={`sent-${item.transferId || item.id}-${index}`}>
                  Sent {item.productName} (Qty: {item.quantity}) to {item.transferredToEmail || 'Unknown'} on {item.transferredAt ? new Date(item.transferredAt.seconds * 1000).toLocaleString() : 'Unknown'}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Subscription Modal */}
      {showSubscriptionModal && (
        <SubscriptionPlans 
          onClose={() => setShowSubscriptionModal(false)}
          showUpgradePrompt={false}
        />
      )}
    </motion.div>
  );
};

export default Wallet;

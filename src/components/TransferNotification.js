import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaGift, FaTimes } from 'react-icons/fa';
import '../styles/TransferNotification.css';

const TransferNotification = ({ notifications, onDismiss }) => {
  const [visibleNotifications, setVisibleNotifications] = useState([]);

  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotification = notifications[notifications.length - 1];
      setVisibleNotifications(prev => [...prev, latestNotification]);
      
      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => {
        setVisibleNotifications(prev => prev.slice(1));
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [notifications]);

  const handleDismiss = (notificationId) => {
    setVisibleNotifications(prev => prev.filter(n => n.id !== notificationId));
    if (onDismiss) onDismiss(notificationId);
  };

  return (
    <div className="notification-container">
      <AnimatePresence>
        {visibleNotifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 25,
              duration: 0.3 
            }}
            className="transfer-notification"
          >
            <div className="notification-icon">
              <FaGift />
            </div>
            <div className="notification-content">
              <div className="notification-title">Transfer Received!</div>
              <div className="notification-message">
                You received {notification.quantity} {notification.productName} from {notification.senderEmail}
              </div>
              <div className="notification-time">
                {new Date().toLocaleTimeString()}
              </div>
            </div>
            <button 
              className="notification-dismiss"
              onClick={() => handleDismiss(notification.id)}
            >
              <FaTimes />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default TransferNotification;

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBell, FaTimes, FaSync } from 'react-icons/fa';
import '../styles/NotificationIcon.css';

const NotificationIcon = ({ notificationCount, onToggle, isOpen, onRefresh }) => {
  return (
    <motion.div
      className="notification-icon-container"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <button
        className="notification-icon-button"
        onClick={onToggle}
        aria-label="Notifications"
      >
        <FaBell className="notification-bell" />
        {notificationCount > 0 && (
          <motion.span
            className="notification-badge"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 15 }}
          >
            {notificationCount > 99 ? '99+' : notificationCount}
          </motion.span>
        )}
      </button>
      
      {/* Notification dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="notification-dropdown"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="notification-dropdown-header">
              <h3>Transfer Notifications</h3>
              <button
                className="close-dropdown"
                onClick={onToggle}
              >
                <FaTimes />
              </button>
            </div>
            <div className="notification-dropdown-content">
              {notificationCount > 0 ? (
                <p className="notification-summary">
                  You have {notificationCount} new transfer{notificationCount > 1 ? 's' : ''}!
                </p>
              ) : (
                <p className="notification-empty">
                  No new transfers
                </p>
              )}
              {onRefresh && (
                <button
                  className="refresh-notifications-btn"
                  onClick={onRefresh}
                  title="Refresh notifications"
                >
                  <FaSync className="refresh-icon" />
                  Refresh
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default NotificationIcon;

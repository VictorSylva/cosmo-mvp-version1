import React, { useState, useCallback } from 'react';
import './ConfirmDialog.css';

const ConfirmDialog = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="confirm-overlay">
      <div className="confirm-dialog">
        <div className="confirm-content">
          <div className="confirm-icon">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="confirm-message">{message}</p>
        </div>
        <div className="confirm-actions">
          <button onClick={onCancel} className="confirm-button confirm-cancel">
            Cancel
          </button>
          <button onClick={onConfirm} className="confirm-button confirm-ok">
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export const ConfirmDialogContainer = () => {
  const [dialog, setDialog] = useState(null);

  React.useEffect(() => {
    window.showConfirm = (message) => {
      return new Promise((resolve) => {
        setDialog({
          message,
          onConfirm: () => {
            setDialog(null);
            resolve(true);
          },
          onCancel: () => {
            setDialog(null);
            resolve(false);
          }
        });
      });
    };

    return () => {
      delete window.showConfirm;
    };
  }, []);

  if (!dialog) return null;

  return <ConfirmDialog {...dialog} />;
};

export default ConfirmDialogContainer;

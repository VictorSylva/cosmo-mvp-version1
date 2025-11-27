import React, { useState } from 'react';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useCart } from '../context/CartContext';
import { PaystackButton } from 'react-paystack';
import '../styles/SubscriptionPlans.css';

const SubscriptionPlans = ({ onClose, showUpgradePrompt = false }) => {
  const { subscribeToPlan, getSubscriptionInfo } = useSubscription();
  const { user } = useCart();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const publicKey = "pk_test_80cd454009d341493a2268547cf40ef0ad5a12c8";

  const plans = [
    {
      id: 'monthly',
      name: 'Monthly Plan',
      price: 3000,
      duration: '1 Month',
      description: 'Unlimited wallet storage for 1 month',
      features: ['Unlimited items in wallet', 'Priority support', 'Advanced features'],
      popular: false
    },
    {
      id: 'six_months',
      name: '6 Months Plan',
      price: 6000,
      duration: '6 Months',
      description: 'Unlimited wallet storage for 6 months',
      features: ['Unlimited items in wallet', 'Priority support', 'Advanced features', 'Better value'],
      popular: true
    },
    {
      id: 'yearly',
      name: 'Yearly Plan',
      price: 10000,
      duration: '1 Year',
      description: 'Unlimited wallet storage for 1 year',
      features: ['Unlimited items in wallet', 'Priority support', 'Advanced features', 'Best value'],
      popular: false
    }
  ];

  const handlePaymentSuccess = async (reference) => {
    try {
      setLoading(true);
      await subscribeToPlan(selectedPlan, reference.reference);
      alert('Subscription successful! You now have unlimited wallet storage.');
      if (onClose) onClose();
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Subscription failed. Please try again.');
    } finally {
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  const handlePaymentClose = () => {
    setLoading(false);
    setSelectedPlan(null);
  };

  const subscriptionInfo = getSubscriptionInfo();

  return (
    <div className="subscription-plans-overlay">
      <div className="subscription-plans-modal">
        <div className="subscription-plans-header">
          <h2>Upgrade Your Wallet Storage</h2>
          {showUpgradePrompt && (
            <p className="upgrade-prompt">
              You've reached the limit of 1 item in your wallet. Subscribe to store unlimited items!
            </p>
          )}
          {onClose && (
            <button className="close-button" onClick={onClose}>
              ×
            </button>
          )}
        </div>

        <div className="subscription-plans-grid">
          {plans.map((plan) => (
            <div 
              key={plan.id} 
              className={`subscription-plan ${plan.popular ? 'popular' : ''}`}
            >
              {plan.popular && <div className="popular-badge">Most Popular</div>}
              
              <div className="plan-header">
                <h3>{plan.name}</h3>
                <div className="plan-price">
                  <span className="currency">₦</span>
                  <span className="amount">{plan.price.toLocaleString()}</span>
                </div>
                <p className="plan-duration">{plan.duration}</p>
              </div>

              <div className="plan-description">
                <p>{plan.description}</p>
              </div>

              <ul className="plan-features">
                {plan.features.map((feature, index) => (
                  <li key={index}>✓ {feature}</li>
                ))}
              </ul>

              {selectedPlan === plan.id ? (
                <PaystackButton
                  className="subscribe-button"
                  email={user?.email}
                  amount={plan.price * 100} // Convert to kobo
                  metadata={{ 
                    plan: plan.id,
                    planName: plan.name,
                    userId: user?.uid 
                  }}
                  publicKey={publicKey}
                  text="Pay Now"
                  onSuccess={handlePaymentSuccess}
                  onClose={handlePaymentClose}
                />
              ) : (
                <button
                  className="subscribe-button"
                  onClick={() => setSelectedPlan(plan.id)}
                  disabled={loading}
                >
                  Subscribe Now
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="subscription-info">
          <p>
            <strong>Current Status:</strong> {subscriptionInfo?.isActive ? 
              `Active ${subscriptionInfo.plan} plan` : 
              'Free plan (1 item limit)'
            }
          </p>
          {subscriptionInfo?.isActive && subscriptionInfo.daysRemaining > 0 && (
            <p>
              <strong>Days Remaining:</strong> {subscriptionInfo.daysRemaining} days
            </p>
          )}
        </div>

        <div className="subscription-footer">
          <p>All plans include unlimited wallet storage and priority support.</p>
          <p>Cancel anytime. No hidden fees.</p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlans;

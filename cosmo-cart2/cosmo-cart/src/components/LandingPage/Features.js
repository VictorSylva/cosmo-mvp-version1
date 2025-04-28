import React from "react";
import "./Features.css";
import lockInFoodPricesImg from "../../assets/images/lock-in-food-prices.png"; 
import seamlessRedemptionImg from "../../assets/images/seamless-redemption.png"; 
import smartFoodWalletImg from "../../assets/images/smart-food-wallet.png"; 

const Features = () => {
  return (
    <section id="features" className="features">
      <h2>Why Use CosmoCart?</h2>
      <div className="features-grid">
        <div className="feature">
          <img src={lockInFoodPricesImg} alt="Lock in Food Prices" />
          <h3>Lock in Food Prices</h3>
          <p>Prepay for food items and avoid price hikes.</p>
        </div>
        <div className="feature">
          <img src={seamlessRedemptionImg} alt="Seamless Redemption" />
          <h3>Seamless Redemption</h3>
          <p>Retrieve your stored groceries at partnered stores anytime.</p>
        </div>
        <div className="feature">
          <img src={smartFoodWalletImg} alt="Smart Food Wallet" />
          <h3>Smart Food Wallet</h3>
          <p>Digitally store your food value and manage your groceries efficiently.</p>
        </div>
      </div>
    </section>
  );
};

export default Features;

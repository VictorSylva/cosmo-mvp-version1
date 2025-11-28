import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/LandingPage.css";
import LandingBg from "../assets/backgroundImage.jpg";
import CosmoCartLogo from "../assets/cosmocart-logo.png";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-page" style={{ backgroundImage: `url(${LandingBg})` }}>
      <div className="landing-overlay">
        <div className="hero-content-centered">
          <div className="landing-logo-container">
            <img src={CosmoCartLogo} alt="CosmoCart Logo" className="landing-logo" />
          </div>
          <h1 className="hero-title">
            Secure Your Food Needs Today, Enjoy Peace of Mind Tomorrow with 
            <span className="highlight"> CosmoCart</span>
          </h1>
          <p className="hero-subtitle">
            Prepay for groceries at today's prices, store your food value in a Virtual Food Wallet, 
            and redeem anytime at partner stores. Protect your family from price inflation while 
            building food security for your community.
          </p>
          <div className="hero-actions-centered">
            <button className="btn-primary btn-large" onClick={() => navigate('/auth')}>
              Get Started
            </button>
            <button className="btn-secondary btn-large" onClick={() => navigate('/login')}>
              Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;

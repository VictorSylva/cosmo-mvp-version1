import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/LandingPage.css";
import LandingBg from "../assets/backgroundImage.jpg";
import CosmoCartLogo from "../assets/cosmoLogo.png";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div
      className="landing-page"
      style={{ backgroundImage: `url(${LandingBg})` }}
    >
      <div className="landing-overlay">
        <div className="hero-content-centered">
          <div className="landing-logo-container">
            <img
              src={CosmoCartLogo}
              alt="CosmoCart Logo"
              className="landing-logo"
            />
          </div>
          <h1 className="hero-title">
            Tomorrow’s food, <br /> already handled.
          </h1>
          <p className="hero-subtitle">
            Secure food at today's prices and pick it up when you need it.
          </p>
          <div className="hero-actions-centered">
            <button className="btn-primary btn-large" onClick={() => navigate('/auth')}>
              Start Your Reserve
            </button>
            <button
              className="btn-secondary btn-large"
              onClick={() => navigate("/login")}
            >
              Login
            </button>
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: '20px', width: '100%', textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Cosmoo. You're covered.</div>
      </div>
    </div>
  );
};

export default LandingPage;

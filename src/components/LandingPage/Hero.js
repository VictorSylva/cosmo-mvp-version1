import React from "react";
import { Link } from "react-router-dom";
import "./Hero.css";
import heroImage from "../../assets/images/hero.jpg";
import googlePlay from "../../assets/images/google-play.png";
import appStore from "../../assets/images/app-store.png";
import avatar1 from "../../assets/images/avatar1.jpg";
import avatar2 from "../../assets/images/avatar2.jpg";
import avatar3 from "../../assets/images/avatar3.jpg";

const Hero = () => {
  return (
    <section className="hero redesigned-hero">
      <div className="hero-left">
        <div className="hero-tagline">Food Deliver Service & Restaurant</div>
        <h1 className="hero-title">Get fresh Grocery</h1>
        <p className="hero-subtitle">Enjoy healthy life.</p>
        <div className="hero-category-row">
          <select className="category-select">
            <option value="">Select Category</option>
            <option value="fruits">Fruits</option>
            <option value="vegetables">Vegetables</option>
            <option value="dairy">Dairy</option>
            <option value="bakery">Bakery</option>
          </select>
          <button className="shop-now-btn">Shop Now</button>
        </div>
        <div className="hero-login-row">
          <span>Not yet Member? <Link to="/signup">Sign Up Now</Link></span>
        </div>
        <div className="hero-buttons">
          <Link to="/login" className="login-button">Login as Regular User</Link>
          <Link to="/partner-store-login" className="login-button">Login as Partner Store</Link>
        </div>
        <div className="hero-customer-review">
          <div className="review-avatars">
            <img src={avatar1} alt="Customer 1" />
            <img src={avatar2} alt="Customer 2" />
            <img src={avatar3} alt="Customer 3" />
          </div>
          <div className="review-info">
            <span className="review-rating">★ 4.5</span>
            <span className="review-count">(12.5k Reviews)</span>
          </div>
        </div>
        <div className="hero-app-download">
          <span>Download App</span>
          <div className="app-buttons">
            <a href="#" className="app-btn"><img src={googlePlay} alt="Google Play" /></a>
            <a href="#" className="app-btn"><img src={appStore} alt="App Store" /></a>
          </div>
        </div>
      </div>
      <div className="hero-right">
        <div className="hero-image-container">
          <img src={heroImage} alt="CosmoCart Hero" className="hero-image" />
          <div className="fresh-badge">
            <span role="img" aria-label="fresh">🍽️</span>
            <div>
              <div className="fresh-badge-title">100% Fresh</div>
              <div className="fresh-badge-desc">Quality maintain</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

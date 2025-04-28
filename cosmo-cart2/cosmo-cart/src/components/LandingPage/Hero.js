import React from "react";
import { Link } from "react-router-dom"; // Import Link
import "./Hero.css";
import heroImage from "../../assets/images/hero.png"; // Import the image

const Hero = () => {
  return (
    <section className="hero">
      <div className="hero-content">
        <h1>Secure Your Food Needs with CosmoCart</h1>
        <p>Prepay for groceries, store value digitally, and retrieve items later from partnered stores.</p>
        <div className="hero-buttons">
          <Link to="/signup" className="cta-button">Get Started</Link>
          <Link to="/login" className="login-button">Login</Link>
        </div>
      </div>
      <img src={heroImage} alt="CosmoCart Hero" className="hero-image" />
    </section>
  );
};

export default Hero;

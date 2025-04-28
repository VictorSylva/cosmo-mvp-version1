import React from "react";
import { Link } from "react-router-dom"; // Import Link
import "./Navbar.css";

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="logo">CosmoCart</div>
      <ul className="nav-links">
        <li><a href="#features">Features</a></li>
        <li><a href="#how-it-works">How It Works</a></li>
        <li><a href="#testimonials">Testimonials</a></li>
      </ul>
      <Link to="/signup">
        <button className="signup-btn">Get Started</button>
      </Link>
    </nav>
  );
};

export default Navbar;

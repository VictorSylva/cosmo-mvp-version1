import React from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";
import logo from "../../assets/cosmocart-logo.png";

const Navbar = () => {
  return (
    <nav className="navbar redesigned-navbar">
      <div className="navbar-logo">
        <img src={logo} alt="CosmoCart Logo" className="navbar-logo-img" />
        <span className="navbar-logo-text">Grocery</span>
      </div>
      <ul className="navbar-links">
        <li><a href="#home">Home</a></li>
        <li><a href="#services">Services</a></li>
        <li><a href="#about">About Us</a></li>
        <li><a href="#categories">Categories</a></li>
        <li><a href="#contact">Contact</a></li>
      </ul>
      <Link to="/signup">
        <button className="navbar-signup-btn">Sign Up</button>
      </Link>
    </nav>
  );
};

export default Navbar;

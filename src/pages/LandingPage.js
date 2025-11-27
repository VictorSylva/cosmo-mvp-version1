import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import CosmoCartLogo from "../assets/cosmocart-logo.png";
import "../styles/LandingPage.css";

// Using professional stock images from free sources
const HeroImage = "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"; // Family grocery shopping
const FeaturesImage = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"; // Fresh produce
const HowItWorksImage = "https://images.unsplash.com/photo-1556742111-a301076d9d18?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"; // Digital shopping
const SmartWalletImage = "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"; // Mobile payment
const LockInPricesImage = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"; // Fresh groceries
const SeamlessRedemptionImage = "https://images.unsplash.com/photo-1556742111-a301076d9d18?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"; // Community sharing
const PartnerStoresImage = "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"; // Partner stores
const TestimonialsImage = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"; // Happy families
const ComparisonImage = "https://images.unsplash.com/photo-1556742111-a301076d9d18?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"; // Digital vs traditional

const LandingPage = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false); // Close mobile menu after navigation
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-container">
          <div className="nav-logo">
            <img src={CosmoCartLogo} alt="CosmoCart" />
          </div>
          <div className="nav-links">
            <button onClick={() => scrollToSection('features')}>Features</button>
            <button onClick={() => scrollToSection('how-it-works')}>How It Works</button>
            <button onClick={() => scrollToSection('testimonials')}>Testimonials</button>
            <button onClick={() => scrollToSection('partners')}>Partners</button>
          </div>
          
          {/* Mobile Menu Toggle */}
          <button className="mobile-menu-toggle" onClick={toggleMobileMenu}>
            <span className={`hamburger ${isMobileMenuOpen ? 'active' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
          <div className="nav-actions">
            <button className="btn-secondary" onClick={() => navigate('/auth')}>
              Login
            </button>
            <button className="btn-primary" onClick={() => navigate('/auth')}>
              Get Started
            </button>
          </div>
          
          {/* Mobile Menu */}
          <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
            <div className="mobile-menu-content">
              <button onClick={() => scrollToSection('features')}>Features</button>
              <button onClick={() => scrollToSection('how-it-works')}>How It Works</button>
              <button onClick={() => scrollToSection('testimonials')}>Testimonials</button>
              <button onClick={() => scrollToSection('partners')}>Partners</button>
              <div className="mobile-menu-actions">
                <button className="btn-secondary" onClick={() => navigate('/auth')}>
                  Login
                </button>
                <button className="btn-primary" onClick={() => navigate('/auth')}>
                  Get Started
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              Secure Your Food Needs Today, Enjoy Peace of Mind Tomorrow with 
              <span className="highlight"> CosmoCart</span>
            </h1>
            <p className="hero-subtitle">
              Prepay for groceries at today's prices, store your food value in a Virtual Food Wallet, 
              and redeem anytime at partner stores. Protect your family from price inflation while 
              building food security for your community.
            </p>
            <div className="hero-actions">
              <button className="btn-primary btn-large" onClick={() => navigate('/auth')}>
                Secure Your Food Future
              </button>
              <button className="btn-secondary btn-large" onClick={() => scrollToSection('how-it-works')}>
                Learn More
              </button>
            </div>
            <div className="hero-stats">
              <div className="stat">
                <span className="stat-number">25,000+</span>
                <span className="stat-label">Families Secured</span>
              </div>
              <div className="stat">
                <span className="stat-number">800+</span>
                <span className="stat-label">Partner Stores</span>
              </div>
              <div className="stat">
                <span className="stat-number">₦150M+</span>
                <span className="stat-label">Food Value Protected</span>
              </div>
            </div>
          </div>
          <div className="hero-image">
            <img src={HeroImage} alt="CosmoCart Hero" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="container">
          <div className="section-header">
            <h2>Empowering Food Security Through Innovation</h2>
            <p>Transform how you think about food shopping with features designed for trust, convenience, and community</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-image">
                <img src={SmartWalletImage} alt="Smart Food Wallet" />
              </div>
              <h3>Virtual Food Wallet</h3>
              <p>Store your food budget securely in our digital wallet. Your food value is always accessible when you need it, giving you peace of mind and financial control over your family's nutrition.</p>
            </div>
            <div className="feature-card">
              <div className="feature-image">
                <img src={LockInPricesImage} alt="Lock in Food Prices" />
              </div>
              <h3>Price Protection</h3>
              <p>Lock in today's grocery prices and protect your family from inflation. Prepay for food items at current market rates and redeem them later, even if prices increase significantly.</p>
            </div>
            <div className="feature-card">
              <div className="feature-image">
                <img src={SeamlessRedemptionImage} alt="Seamless Redemption" />
              </div>
              <h3>Community Sharing</h3>
              <p>Share food value with family, friends, or neighbors in need. Transfer groceries digitally to support your community and reduce food waste through thoughtful sharing.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="how-it-works-section">
        <div className="container">
          <div className="section-header">
            <h2>How CosmoCart Works</h2>
            <p>Simple steps to secure your family's food future and build community resilience</p>
          </div>
          <div className="steps-container">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Register & Browse</h3>
              <p>Sign up on CosmoCart and explore our marketplace of essential food items ready for prepayment.</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>Prepay & Secure</h3>
              <p>Select your groceries, prepay at today's price, and store their value in your Virtual Food Wallet.</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>Redeem & Share</h3>
              <p>Redeem your food at partner stores or share food value with family and friends — your price protection is guaranteed.</p>
            </div>
          </div>
          <div className="how-it-works-image">
            <img src={HowItWorksImage} alt="How CosmoCart Works" />
          </div>
        </div>
      </section>

      {/* Partner Stores Section */}
      <section id="partners" className="partners-section">
        <div className="container">
          <div className="section-header">
            <h2>Trusted Partner Network</h2>
            <p>Redeem your secured groceries at quality stores nationwide, building stronger communities together</p>
          </div>
          <div className="partners-content">
            <div className="partners-image">
              <img src={PartnerStoresImage} alt="Partner Stores" />
            </div>
            <div className="partners-text">
              <h3>Community-Focused Stores</h3>
              <p>Our partner stores share our mission of food security and community support. They provide fresh, quality products while helping families access affordable nutrition through our platform.</p>
              <ul className="partners-benefits">
                <li>✓ Convenient locations nationwide</li>
                <li>✓ Fresh produce and quality products</li>
                <li>✓ Community-minded staff</li>
                <li>✓ Seamless redemption process</li>
              </ul>
              <button className="btn-primary" onClick={() => navigate('/auth')}>
                Find Stores Near You
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="testimonials-section">
        <div className="container">
          <div className="section-header">
            <h2>Stories of Food Security</h2>
            <p>Real families sharing how CosmoCart has transformed their approach to food planning and community support</p>
          </div>
          <div className="testimonials-image">
            <img src={TestimonialsImage} alt="Customer Testimonials" />
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="comparison-section">
        <div className="container">
          <div className="section-header">
            <h2>Why families are choosing CosmoCart over uncertainty</h2>
            <p>See the difference between traditional shopping and CosmoCart's food security approach</p>
          </div>
          
          <div className="comparison-container">
            {/* Traditional Shopping Side */}
            <div className="comparison-side traditional-side">
              <div className="comparison-header">
                <div className="comparison-icon traditional-icon">
                  <span>🛒</span>
                </div>
                <h3>Traditional Shopping</h3>
                <p>Uncertainty and rising costs</p>
              </div>
              
              <div className="comparison-features">
                <div className="feature-item traditional-feature">
                  <span className="feature-icon">📈</span>
                  <div className="feature-content">
                    <h4>Rising Prices</h4>
                    <p>Prices increase unpredictably, making budgeting difficult</p>
                  </div>
                </div>
                
                <div className="feature-item traditional-feature">
                  <span className="feature-icon">❓</span>
                  <div className="feature-content">
                    <h4>Uncertainty</h4>
                    <p>No guarantee of availability or pricing when you need items</p>
                  </div>
                </div>
                
                <div className="feature-item traditional-feature">
                  <span className="feature-icon">🚗</span>
                  <div className="feature-content">
                    <h4>Frequent Trips</h4>
                    <p>Multiple store visits required, wasting time and fuel</p>
                  </div>
                </div>
                
                <div className="feature-item traditional-feature">
                  <span className="feature-icon">🗑️</span>
                  <div className="feature-content">
                    <h4>Food Waste</h4>
                    <p>Overbuying leads to spoilage and wasted money</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* CosmoCart Side */}
            <div className="comparison-side cosmocart-side">
              <div className="comparison-header">
                <div className="comparison-icon cosmocart-icon">
                  <span>🛡️</span>
                </div>
                <h3>CosmoCart</h3>
                <p>Food security and peace of mind</p>
              </div>
              
              <div className="comparison-features">
                <div className="feature-item cosmocart-feature">
                  <span className="feature-icon">🔒</span>
                  <div className="feature-content">
                    <h4>Locked Prices</h4>
                    <p>Prepay at today's prices, protected from inflation</p>
                  </div>
                </div>
                
                <div className="feature-item cosmocart-feature">
                  <span className="feature-icon">✅</span>
                  <div className="feature-content">
                    <h4>Guaranteed Access</h4>
                    <p>Your food value is secured and always available</p>
                  </div>
                </div>
                
                <div className="feature-item cosmocart-feature">
                  <span className="feature-icon">🏪</span>
                  <div className="feature-content">
                    <h4>Convenient Redemption</h4>
                    <p>Redeem at any partner store, anytime</p>
                  </div>
                </div>
                
                <div className="feature-item cosmocart-feature">
                  <span className="feature-icon">🤝</span>
                  <div className="feature-content">
                    <h4>Community Sharing</h4>
                    <p>Share food value with family and friends</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="comparison-cta">
            <button className="btn-primary btn-large" onClick={() => navigate('/auth')}>
              Start securing your food today
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Build Your Family's Food Security?</h2>
            <p>Join thousands of families who are protecting their food budget and supporting their communities through CosmoCart</p>
            <div className="cta-actions">
              <button className="btn-primary btn-large" onClick={() => navigate('/auth')}>
                Start Your Food Security Journey
              </button>
              <button className="btn-secondary btn-large" onClick={() => navigate('/auth')}>
                Login to Account
              </button>
            </div>
            <div className="cta-features">
              <span>✓ No monthly fees</span>
              <span>✓ Secure payments</span>
              <span>✓ Community sharing</span>
              <span>✓ Price protection</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-logo">
              <img src={CosmoCartLogo} alt="CosmoCart" />
            </div>
            <div className="footer-links">
              <div className="footer-column">
                <h4>Product</h4>
                <a href="#features">Features</a>
                <a href="#how-it-works">How It Works</a>
                <a href="#partners">Partner Stores</a>
              </div>
              <div className="footer-column">
                <h4>Support</h4>
                <a href="#">Help Center</a>
                <a href="#">Contact Us</a>
                <a href="#">FAQ</a>
              </div>
              <div className="footer-column">
                <h4>Company</h4>
                <a href="#">About Us</a>
                <a href="#">Privacy Policy</a>
                <a href="#">Terms of Service</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 CosmoCart. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

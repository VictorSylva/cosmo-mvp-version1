import React from "react";
import "./HowItWorks.css";
import howItWorksImage from "../../assets/images/how_it_works.png"; // Import image

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="how-it-works">
      <h2>How It Works</h2>
      <div className="steps">
        <div className="step">
          <h3>Step 1</h3>
          <p>Choose and prepay for groceries online.</p>
        </div>
        <div className="step">
          <h3>Step 2</h3>
          <p>Store food value in your digital wallet.</p>
        </div>
        <div className="step">
          <h3>Step 3</h3>
          <p>Redeem groceries from a partner store whenever you need.</p>
        </div>
      </div>
      <img src={howItWorksImage} alt="How It Works" className="how-it-works-image" />
    </section>
  );
};

export default HowItWorks;

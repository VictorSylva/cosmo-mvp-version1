import React from "react";
import "./Testimonials.css";

const Testimonials = () => {
  return (
    <section id="testimonials" className="testimonials">
      <h2>What Our Users Say</h2>
      <div className="testimonial">
        <p>"CosmoCart helped me secure food at affordable prices!"</p>
        <h4>- Jane Chukuma</h4>
      </div>
      <div className="testimonial">
        <p>"I love how easy it is to redeem my groceries!"</p>
        <h4>- John Smith</h4>
      </div>
    </section>
  );
};

export default Testimonials;

import React from 'react'
import './CTASection.css'

const CTASection = () => {
  return (
    <section className="cta-section">
      <div className="cta-container">
        <div className="cta-content">
          <h2 className="cta-headline">Ready to Start Your Partnership Journey?</h2>
          <p className="cta-subheading">
            Join thousands of successful authorized partners and transform your financial advisory business today.
          </p>
          <div className="cta-buttons">
            <button className="cta-button-primary">Register Now</button>
            <button className="cta-button-secondary">Learn More</button>
          </div>
          <p className="cta-note">
            No upfront investment required • Quick approval process • Comprehensive training & support
          </p>
        </div>
      </div>
    </section>
  )
}

export default CTASection

import React, { useState } from 'react'
import './HeroSection.css'

const HeroSection = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: ''
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Handle form submission
    console.log('Form submitted:', formData)
  }

  return (
    <section className="hero-section">
      <div className="hero-container">
        <div className="hero-content">
          <div className="hero-left">
            <div className="hero-badge">
              <span className="badge-icon">✓</span>
              <span>Authorized Partner Program</span>
            </div>
            <h1 className="hero-headline">
              Become an Authorized Partner and Grow Your Financial Advisory Business
            </h1>
            <p className="hero-subheading">
              Join India's leading fintech platform and unlock unlimited opportunities to expand your client base, increase revenue, and build a successful advisory practice.
            </p>
            
            <div className="hero-metrics">
              <div className="metric-card">
                <div className="metric-value">50,000+</div>
                <div className="metric-label">Active Partners</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">₹500Cr+</div>
                <div className="metric-label">Monthly Trading Volume</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">4.8/5</div>
                <div className="metric-label">Partner Satisfaction</div>
              </div>
            </div>
          </div>

          <div className="hero-right">
            <div className="registration-card">
              <h2 className="card-title">Start Your Partnership Journey</h2>
              <p className="card-subtitle">Fill in your details and our team will get in touch</p>
              
              <form onSubmit={handleSubmit} className="registration-form">
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter your phone number"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="city">City</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Enter your city"
                    required
                  />
                </div>

                <button type="submit" className="form-submit-btn">
                  Register Now
                </button>

                <p className="form-note">
                  By submitting, you agree to our Terms & Conditions and Privacy Policy
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection

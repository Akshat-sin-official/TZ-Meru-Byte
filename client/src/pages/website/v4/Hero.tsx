import React from 'react';
import { Link } from 'react-router-dom';
import { Palette, TrendingUp, Megaphone, FileText } from 'lucide-react';

const Hero: React.FC = () => {
  return (
    <>
      <header className="martech-hero" id="hero">
        <div className="hero-container">
          <div className="hero-tag">
            <span>Welcome to MarTechAdda</span>
          </div>
          <h1 className="hero-title">
            Find, Hire & Manage <br className="mobile-br" />
            Marketing Expertise
          </h1>
          <p className="hero-description">
            Discover relevant marketing services and specialists through a requirement-first marketing marketplace.
          </p>

          <h2 className="hero-question-title">What do you need help with?</h2>

          <div className="hero-categories-grid">
            <Link to="/experts?category=Branding%20Services" className="hero-category-card">
              <div className="hero-category-icon">
                <Palette size={24} />
              </div>
              <h3 className="hero-category-title">Branding</h3>
              <p className="hero-category-desc">
                Build, launch and strengthen brands.
              </p>
              <div className="hero-category-tags">
                Brand Strategy • Brand Identity • Brand Positioning • Employer Branding
              </div>
            </Link>

            <Link to="/experts?category=Strategic%20Marketing%20Services" className="hero-category-card">
              <div className="hero-category-icon">
                <TrendingUp size={24} />
              </div>
              <h3 className="hero-category-title">Strategic Marketing</h3>
              <p className="hero-category-desc">
                Plan growth, customer acquisition and market expansion.
              </p>
              <div className="hero-category-tags">
                Go-to-Market Strategy • Growth Strategy • CRM Strategy • Content Strategy
              </div>
            </Link>

            <Link to="/experts?category=Advertising%20Services" className="hero-category-card">
              <div className="hero-category-icon">
                <Megaphone size={24} />
              </div>
              <h3 className="hero-category-title">Advertising</h3>
              <p className="hero-category-desc">
                Reach the right audience through targeted campaigns.
              </p>
              <div className="hero-category-tags">
                Search Advertising • Social Media Advertising • Display Advertising • Influencer Advertising
              </div>
            </Link>

            <Link to="/experts?category=Marketing%20Collateral%20Services" className="hero-category-card">
              <div className="hero-category-icon">
                <FileText size={24} />
              </div>
              <h3 className="hero-category-title">Marketing Collateral</h3>
              <p className="hero-category-desc">
                Create digital and print marketing assets.
              </p>
              <div className="hero-category-tags">
                Brochures • Presentations • Landing Pages • Sales Collateral
              </div>
            </Link>
          </div>


        </div>
      </header>
    </>
  );
};

export default Hero;

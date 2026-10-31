import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import './styles/index.css';

import Background from './Background';
import Hero from './Hero';
import Brands from './Brands';
import Problem from './Problem';
import Solution from './Solution';
import Features from './Features';
import Scroller from './Scroller';
import Growth from './Growth';
import ServingMMR from './ServingMMR';
import DeliverBetterMatches from './DeliverBetterMatches';
import HowHiringWorks from './HowHiringWorks';
import DualRolePathways from './DualRolePathways';
import InnovationProof from './InnovationProof';
// import Testimonials from './Testimonials';
import About from './About';
import Comparison from './Comparison';
import ClosingCTA from './ClosingCTA';
// import Contact from './Contact';
import FAQ from './FAQ';
import Footer from './Footer';

const HomeV4: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logout, getDashboardPath } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.title = 'MarTechAdda - Find Marketing Expertise That Fits Your Business Goals';

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        'MarTechAdda helps businesses discover verified marketing expertise aligned with their goals. Gain clarity, reduce hiring risk, and align before commitment. No RFPs. No paid rankings.'
      );
    }

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);

    // Hash link scrolling handler
    const handleHashLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (anchor) {
        const href = anchor.getAttribute('href');
        if (href && href.startsWith('#')) {
          e.preventDefault();
          const targetEl = document.getElementById(href.slice(1));
          if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }
    };

    // FAQ Accordion Handler
    const handleFaqClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const faqItem = target.closest('.framer-XmLyD');
      if (faqItem) {
        faqItem.classList.toggle('faq-open');
        const answer = faqItem.querySelector('.framer-answer') as HTMLElement;
        if (answer) {
          if (faqItem.classList.contains('faq-open')) {
            answer.style.maxHeight = answer.scrollHeight + 'px';
            answer.style.opacity = '1';
            answer.style.paddingBottom = '20px';
          } else {
            answer.style.maxHeight = '0px';
            answer.style.opacity = '0';
            answer.style.paddingBottom = '0px';
          }
        }
      }
    };

    document.addEventListener('click', handleHashLinkClick);
    document.addEventListener('click', handleFaqClick);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('click', handleHashLinkClick);
      document.removeEventListener('click', handleFaqClick);
    };
  }, []);

  return (
    <div
      className="martechadda-theme"
      style={{ position: 'relative', width: '100%', overflowX: 'hidden', background: '#fbfaf8' }}
    >
      {/* Custom Minimalist Header with Glassmorphism */}
      <header className={`martech-header ${isScrolled ? 'header-scrolled' : ''}`}>
        <Link to="/" className="logo-container">
          <img src="/logo.png" alt="MarTechAdda Logo" className="logo-img" />
          <span className="logo-text">MarTechAdda</span>
        </Link>

        <nav className="nav-links">
          <span className="nav-separator">|</span>
          <a href="#services" className="nav-link">
            Marketing Services
          </a>
          <span className="nav-separator">|</span>
          <Link to="/how-it-works" className="nav-link">
            How It Works
          </Link>
          <span className="nav-separator">|</span>
          <a href="/v2/home#resources" className="nav-link">
            Resources
          </a>
          <span className="nav-separator">|</span>
          <Link to="/service-expert-register" className="nav-link">
            For Experts
          </Link>
          <span className="nav-separator">|</span>
          {isAuthenticated ? (
            <>
              <Link to={getDashboardPath()} className="nav-link">
                Dashboard
              </Link>
              <span className="nav-separator">|</span>
              <button
                onClick={async () => {
                  await logout();
                  navigate('/');
                }}
                className="nav-link nav-btn-link"
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="nav-link">
              Login
            </Link>
          )}
        </nav>

        <button
          className="nav-mobile-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle Menu"
        >
          <span className={isMobileMenuOpen ? 'open' : ''}></span>
          <span className={isMobileMenuOpen ? 'open' : ''} style={{ margin: '4px 0' }}></span>
          <span className={isMobileMenuOpen ? 'open' : ''}></span>
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      <div className={`mobile-menu-overlay ${isMobileMenuOpen ? 'active' : ''}`}>
        <button className="mobile-menu-close" onClick={() => setIsMobileMenuOpen(false)}>
          &times;
        </button>
        <div className="mobile-menu-links">
          <a href="#services" onClick={() => setIsMobileMenuOpen(false)}>
            Marketing Services
          </a>
          <Link to="/how-it-works" onClick={() => setIsMobileMenuOpen(false)}>
            How It Works
          </Link>
          <a href="/v2/home#resources" onClick={() => setIsMobileMenuOpen(false)}>
            Resources
          </a>
          <Link to="/service-expert-register" onClick={() => setIsMobileMenuOpen(false)}>
            For Experts
          </Link>
          <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '15px 0', width: '100%' }} />
          {isAuthenticated ? (
            <>
              <Link
                to={getDashboardPath()}
                className="mobile-menu-cta"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <button
                onClick={async () => {
                  await logout();
                  navigate('/');
                  setIsMobileMenuOpen(false);
                }}
                className="mobile-menu-cta outline"
                style={{ background: 'none', border: '2px solid #fff', cursor: 'pointer' }}
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="mobile-menu-cta"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Login
            </Link>
          )}
        </div>
      </div>

      {/* Render whole framer layout using modular TSX components */}
      <div id="main">
        <div
          className="framer-4iGrb framer-VMsKn framer-rop85d"
          data-framer-root=""
          style={{ minHeight: '100vh', width: 'auto' } as React.CSSProperties}
        >
          <Background />
          <Hero />
          <Solution />
          <Features />
          <Problem />
          <Brands />
          {/* <Growth /> */}
          <DeliverBetterMatches />
          <HowHiringWorks />
          <DualRolePathways />
          <InnovationProof />
          <Comparison />
          <About />
          <FAQ />
          <ClosingCTA />
          <Scroller />
          <Footer />
          {/* <ServingMMR /> */}
          {/* <Testimonials /> */}
          {/* <Contact /> */}
        </div>
      </div>

      <div id="overlay"></div>
    </div>
  );
};

export default HomeV4;

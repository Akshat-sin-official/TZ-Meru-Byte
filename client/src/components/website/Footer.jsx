import React from 'react'
import { Link } from 'react-router-dom'
import { FiFacebook, FiLinkedin, FiInstagram, FiMail, FiMapPin } from 'react-icons/fi'
import Logo from './Logo'
import styles from './Footer.module.css'

const getWebsiteUrl = (path = '') => {
  const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const baseUrl = isLocal ? 'http://localhost:5174' : 'https://martechadda.com';
  return `${baseUrl}${path.startsWith('/') ? path : '/' + path}`;
};

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        {/* Main Footer Content */}
        <div className={styles.footerContent}>
          {/* Brand Section */}
          <div className={styles.footerSection}>
            <Logo className={styles.footerLogo} showTagline={false} linkTo="/login" variant="footer" />
            <p className={styles.footerTagline}>
              Built for businesses and marketing professionals. A neutral, marketing-only platform designed for clarity before commitment.
            </p>
            <div className={styles.serviceAvailability}>
              <span className={styles.serviceAvailabilityLabel}>Service availability (current phase):</span>
              <span className={styles.serviceAvailabilityText}>Currently serving across the Mumbai Metropolitan Region (MMR).</span>
            </div>
            <div className={styles.socialIcons}>
              <a
                href="https://www.linkedin.com/company/martechadda/"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialIcon}
                aria-label="LinkedIn"
              >
                <FiLinkedin />
              </a>
              <a
                href="https://www.instagram.com/martechadda/"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialIcon}
                aria-label="Instagram"
              >
                <FiInstagram />
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=61585573262776"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialIcon}
                aria-label="Facebook"
              >
                <FiFacebook />
              </a>
            </div>
          </div>

          {/* Platform Links */}
          <div className={styles.footerSection}>
            <h4 className={styles.footerTitle}>Platform</h4>
            <ul className={styles.footerLinks}>
              <li><a href={getWebsiteUrl('/')} className={styles.footerLink}>Home</a></li>
              <li><a href={getWebsiteUrl('/about')} className={styles.footerLink}>About Us</a></li>
              <li><a href={getWebsiteUrl('/how-it-works')} className={styles.footerLink}>How It Works</a></li>
              <li><a href={getWebsiteUrl('/why-martechadda')} className={styles.footerLink}>Why This Works</a></li>
              <li><Link to="/register-expert" className={styles.footerLink}>Join as an Expert</Link></li>
              <li><Link to="/login" className={styles.footerLink}>Login</Link></li>
            </ul>
          </div>

          {/* Support Links */}
          <div className={styles.footerSection}>
            <h4 className={styles.footerTitle}>Support</h4>
            <ul className={styles.footerLinks}>
              <li><a href={getWebsiteUrl('/resources/faq')} className={styles.footerLink}>FAQs</a></li>
              <li><a href={getWebsiteUrl('/contact')} className={styles.footerLink}>Contact Us</a></li>
              <li><a href={getWebsiteUrl('/contact')} className={styles.footerLink}>Feedback</a></li>
            </ul>
          </div>

          {/* Legal Links */}
          <div className={styles.footerSection}>
            <h4 className={styles.footerTitle}>Legal</h4>
            <ul className={styles.footerLinks}>
              <li><Link to="/privacy" className={styles.footerLink}>Privacy Policy</Link></li>
              <li><Link to="/terms" className={styles.footerLink}>Terms of Service</Link></li>
              <li><Link to="/refund-policy" className={styles.footerLink}>Refund & Cancellation Policy</Link></li>
            </ul>
          </div>
        </div>

        {/* Company Info & Copyright */}
        <div className={styles.footerBottom}>
          {/* Part 1: Company Profile */}
          <div className={styles.companyInfo}>
            <div className={styles.companyDetails}>
              <p className={styles.companyName}>MarTechAdda Private Limited</p>
              <div className={styles.companyAddress}>
                <span className={styles.addressLine}>
                  <FiMapPin className={styles.icon} />
                  A-1702, 17th FLR, Parinee Crescenzo, Bandra Kurla Complex (BKC), Mumbai – 400051, Maharashtra, India
                </span>
              </div>
              <a href="mailto:support@martechadda.com" className={styles.emailLink}>
                <FiMail className={styles.icon} />
                support@martechadda.com
              </a>
            </div>
          </div>

          {/* Part 2: Corporate Registrations */}
          <div className={styles.registrationInfo}>
            <div className={styles.registrationDetails}>
              <p className={styles.registrationLine}>
                <strong className={styles.infoLabel}>CIN:</strong> U62099MH2025PTC456979
              </p>
              <p className={styles.registrationLine}>
                <strong className={styles.infoLabel}>GSTIN:</strong> 27AATCM8716B1Z6
              </p>
              <p className={styles.registrationLine}>
                <strong className={styles.infoLabel}>Udyam:</strong> UDYAM-MH-19-0393544
              </p>
              <p className={styles.registrationLine}>
                <strong className={styles.infoLabel}>DPIIT Startup India:</strong> DIPP237729
              </p>
            </div>
          </div>

          {/* Part 3: Copyright & Rights */}
          <div className={styles.copyrightContainer}>
            <p className={styles.footerCopyright}>
              © 2026 MarTechAdda Private Limited. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer

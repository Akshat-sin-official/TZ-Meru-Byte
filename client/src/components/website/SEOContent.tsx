import { Link } from 'react-router-dom';
import { Briefcase, TrendingUp, Megaphone, FileText, CheckCircle2, MapPin } from 'lucide-react';
// @ts-ignore
import SectionWrapper from './SectionWrapper';
import styles from './SEOContent.module.css';

const SEOContent = () => {
  return (
    <SectionWrapper sectionType="seo-content">
      <section className={styles.seoSection}>
        <div className={`container ${styles.container}`}>
          {/* Main H1 for SEO - Compact */}
          <div className={styles.header}>
            <h1 className={styles.mainTitle}>
              Find Verified Marketing Experts Across{' '}
              <span className={styles.highlight}>Branding, Strategy, Advertising & Collateral</span>
            </h1>
            <p className={styles.subtitle}>
              Connect with specialized marketing professionals based on real expertise, not paid rankings
            </p>
          </div>

          {/* What is MarTechAdda */}
          <section className={styles.aboutSection}>
            <h2 className={styles.sectionTitle}>What is MarTechAdda?</h2>
            <p className={styles.aboutText}>
              MarTechAdda is a <strong>neutral discovery platform</strong> that helps businesses find and connect with verified marketing professionals based on real expertise and specialization. We bring <strong>clarity before hiring</strong> — so you understand what expertise you need, and who is best suited to deliver it.
            </p>
          </section>

          {/* 4 Service Pillars */}
          <section className={styles.servicesSection}>
            <div className={styles.serviceHeader}>
              <h2 className={styles.sectionTitle}>Choose Experts by Specialization</h2>
              <p className={styles.serviceSubtitle}>
                Marketing services organized into four core pillars — find specialists, not generalists
              </p>
            </div>

            <div className={styles.serviceGrid}>
              {/* Branding */}
              <Link to="/branding-experts-mumbai" className={styles.serviceCard}>
                <div className={styles.iconWrapper}>
                  <Briefcase className={styles.icon} />
                </div>
                <h3 className={styles.cardTitle}>Branding</h3>
                <p className={styles.cardDescription}>
                  Brand strategy, visual identity, messaging, employer branding, and personal branding
                </p>
                <span className={styles.cardLink}>Find Experts →</span>
              </Link>

              {/* Strategic Marketing */}
              <Link to="/marketing-strategy-consultants-mumbai" className={styles.serviceCard}>
                <div className={styles.iconWrapper}>
                  <TrendingUp className={styles.icon} />
                </div>
                <h3 className={styles.cardTitle}>Strategic Marketing</h3>
                <p className={styles.cardDescription}>
                  Growth strategy, funnel planning, go-to-market strategy, content and CRM strategy
                </p>
                <span className={styles.cardLink}>Find Consultants →</span>
              </Link>

              {/* Advertising */}
              <Link to="/advertising-experts-mumbai" className={styles.serviceCard}>
                <div className={styles.iconWrapper}>
                  <Megaphone className={styles.icon} />
                </div>
                <h3 className={styles.cardTitle}>Advertising</h3>
                <p className={styles.cardDescription}>
                  Search, social, video, outdoor, influencer, and experiential advertising campaigns
                </p>
                <span className={styles.cardLink}>Find Experts →</span>
              </Link>

              {/* Marketing Collateral */}
              <Link to="/marketing-collateral-designers-mumbai" className={styles.serviceCard}>
                <div className={styles.iconWrapper}>
                  <FileText className={styles.icon} />
                </div>
                <h3 className={styles.cardTitle}>Marketing Collateral</h3>
                <p className={styles.cardDescription}>
                  Websites, landing pages, pitch decks, brochures, sales and campaign assets
                </p>
                <span className={styles.cardLink}>Find Designers →</span>
              </Link>
            </div>
          </section>

          {/* Combined: Location + Trust */}
          <div className={styles.bottomSection}>
            {/* Mumbai Region */}
            <div className={styles.locationCard}>
              <div className={styles.cardHeader}>
                <MapPin className={styles.headerIcon} />
                <h2 className={styles.cardHeaderTitle}>Mumbai Metropolitan Region</h2>
              </div>
              <p className={styles.locationText}>
                Serving businesses across <strong>South Mumbai, Western Suburbs, Central Suburbs, Thane, Navi Mumbai, Kalyan–Dombivli, Mira–Bhayandar</strong>, and surrounding regions with marketing professionals who understand local markets and industry dynamics.
              </p>
            </div>

            {/* Why Trust MarTechAdda */}
            <div className={styles.trustCard}>
              <h2 className={styles.trustTitle}>Why Businesses Trust Us</h2>
              <ul className={styles.trustList}>
                <li className={styles.trustItem}>
                  <CheckCircle2 className={styles.checkIcon} />
                  <span>Experts are verified before being listed</span>
                </li>
                <li className={styles.trustItem}>
                  <CheckCircle2 className={styles.checkIcon} />
                  <span>Discovery based on specialization, not ad spend</span>
                </li>
                <li className={styles.trustItem}>
                  <CheckCircle2 className={styles.checkIcon} />
                  <span>No sponsored rankings or pay-to-win visibility</span>
                </li>
                <li className={styles.trustItem}>
                  <CheckCircle2 className={styles.checkIcon} />
                  <span>Direct connection with marketing professionals</span>
                </li>
                <li className={styles.trustItem}>
                  <CheckCircle2 className={styles.checkIcon} />
                  <span>Structured service classification for better matching</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </SectionWrapper>
  );
};

export default SEOContent;

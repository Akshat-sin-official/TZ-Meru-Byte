import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';

const DualRolePathways: React.FC = () => {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  const pathways = [
    {
      label: 'Businesses',
      title: 'Select your requirements. Discover relevant marketing expertise.',
      subtext: 'Projects • Contract Assignments • Outsourcing • Specialized Support',
      cta: 'Select Requirements',
      to: '/experts',
      primary: true,
    },
    {
      label: 'Marketing Professionals & Specialist Firms',
      title: 'Showcase your expertise. Get discovered for relevant business opportunities.',
      subtext: 'Independent Consultants • Freelance Specialists • Boutique Agencies • Specialist Firms • Extended Marketing Teams',
      cta: 'Create Expert Profile',
      to: '/service-expert-register',
      primary: false,
    },
  ];

  return (
    <section ref={ref} className="mt-section mt-section--white">
      <div className="mt-section__inner">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mt-section__header"
        >
          <span className="mt-eyebrow">CHOOSE YOUR PATH</span>
          <h2 className="mt-h2">Choose Your Path</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pathways.map((p, i) => (
            <motion.div
              key={p.label}
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15 + i * 0.1 }}
              style={{
                background: p.primary ? '#0a0a0a' : '#fcfbfa',
                border: p.primary ? 'none' : '1px solid rgba(0,0,0,0.08)',
                borderRadius: '10px',
                padding: '48px 40px',
                color: p.primary ? '#fff' : '#0a0a0a',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '340px',
              }}
            >
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '12px',
                  fontWeight: 600,
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  color: p.primary ? '#ff7a3d' : '#ff2e2e',
                  marginBottom: '24px',
                }}
              >
                {p.label}
              </span>

              <h3
                style={{
                  fontFamily: '"Switzer", sans-serif',
                  fontSize: '28px',
                  fontWeight: 700,
                  lineHeight: 1.2,
                  letterSpacing: '-0.6px',
                  color: p.primary ? '#fff' : '#0a0a0a',
                  margin: '0 0 16px 0',
                }}
              >
                {p.title}
              </h3>

              <p
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14.5px',
                  color: p.primary ? 'rgba(255, 255, 255, 0.7)' : '#666666',
                  margin: '0 0 auto 0',
                  lineHeight: 1.6,
                  paddingBottom: '40px',
                }}
              >
                {p.subtext}
              </p>

              <Link
                to={p.to}
                className={p.primary ? 'mt-btn mt-btn--secondary' : 'mt-btn mt-btn--primary'}
                style={{ alignSelf: 'flex-start' }}
              >
                {p.cta}
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DualRolePathways;

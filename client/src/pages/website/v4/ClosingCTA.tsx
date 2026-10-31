import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';

const ClosingCTA: React.FC = () => {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="mt-section mt-section--cream" style={{ paddingTop: '140px', paddingBottom: '140px' }}>
      {/* Subtle grid background like hero */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(0,0,0,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.012) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
        }}
      />
      {/* Soft radial accents (matching hero) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 80% 20%, rgba(255, 46, 46, 0.05) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(138, 67, 225, 0.05) 0%, transparent 50%)',
          pointerEvents: 'none',
        }}
      />

      <div className="mt-section__inner--narrow" style={{ position: 'relative', textAlign: 'center' }}>
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4 }}
          className="mt-eyebrow"
        >
          Get Started
        </motion.span>

        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-h2"
          style={{ fontSize: 'clamp(40px, 6vw, 68px)', letterSpacing: '-2.2px', marginBottom: '20px' }}
        >
          Ready to hire — or be hired —<br />with clarity?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-lede"
          style={{ marginBottom: '48px' }}
        >
          Skip the RFPs, pitches, and guesswork. Start with alignment.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
          style={{
            display: 'flex',
            gap: '14px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: '48px',
          }}
        >
          <Link to="/experts" className="mt-btn mt-btn--primary">
            Find Marketing Experts
          </Link>
          <Link to="/service-expert-register" className="mt-btn mt-btn--secondary">
            Join As Marketing Expert
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            color: '#888',
            borderTop: '1px solid rgba(0,0,0,0.06)',
            paddingTop: '28px',
            maxWidth: '420px',
            margin: '0 auto',
          }}
        >
          Verified Experts · No Paid Rankings · Clarity Before Commitment
        </motion.div>
      </div>
    </section>
  );
};

export default ClosingCTA;

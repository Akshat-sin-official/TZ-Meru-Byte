import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const principles = [
  {
    label: 'Neutral by Design',
    body: 'No paid rankings. Merit-based discovery.',
  },
  {
    label: 'A Neutral Facilitator',
    body: "Not an agency. We don't sell services.",
  },
  {
    label: 'Built Only for Marketing',
    body: 'A platform focused exclusively on marketing expertise.',
  },
  {
    label: 'Verified, Not Sponsored',
    body: 'Experts are reviewed before visibility.',
  },
];

const InnovationProof: React.FC = () => {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="mt-section mt-section--dark">
      <div className="mt-section__inner">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mt-section__header"
        >
          <span className="mt-eyebrow">Designed With Intention</span>
          <h2 className="mt-h2">
            Built on clarity —<br />not just speed.
          </h2>
          <p className="mt-lede">How MarTechAdda is designed at its core.</p>
        </motion.div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
          className="ip-grid"
        >
          {principles.map((p, i) => (
            <motion.div
              key={p.label}
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15 + i * 0.1 }}
              style={{
                padding: '40px 32px',
                borderRight: i < principles.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none',
              }}
              className="ip-cell"
            >
              <span
                style={{
                  fontFamily: '"Switzer", sans-serif',
                  fontSize: '13px',
                  fontWeight: 600,
                  letterSpacing: '1px',
                  color: '#ff7a3d',
                  marginBottom: '16px',
                  display: 'inline-block',
                }}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3
                style={{
                  fontFamily: '"Switzer", sans-serif',
                  fontSize: '20px',
                  fontWeight: 700,
                  letterSpacing: '-0.4px',
                  color: '#fff',
                  margin: '0 0 12px',
                  lineHeight: 1.3,
                }}
              >
                {p.label}
              </h3>
              <p
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  lineHeight: 1.6,
                  color: 'rgba(255,255,255,0.55)',
                  margin: 0,
                }}
              >
                {p.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .ip-grid { grid-template-columns: 1fr 1fr !important; }
          .ip-cell:nth-child(2n) { border-right: none !important; }
          .ip-cell:nth-child(1), .ip-cell:nth-child(2) { border-bottom: 1px solid rgba(255,255,255,0.1); }
        }
        @media (max-width: 560px) {
          .ip-grid { grid-template-columns: 1fr !important; }
          .ip-cell { border-right: none !important; border-bottom: 1px solid rgba(255,255,255,0.1) !important; }
          .ip-cell:last-child { border-bottom: none !important; }
        }
      `}</style>
    </section>
  );
};

export default InnovationProof;

import React, { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';

const chooseItems = [
  {
    number: '✓',
    title: 'Requirement-First Discovery',
    body: 'Match requirements. Skip the profile hunt.',
  },
  {
    number: '✓',
    title: 'Marketing-Only Platform',
    body: 'Built exclusively for marketing services.',
  },
  {
    number: '✓',
    title: 'Compare & Evaluate',
    body: 'Compare relevant options before hiring.',
  },
  {
    number: '✓',
    title: 'Connect & Discuss',
    body: 'Discuss requirements before committing.',
  },
  {
    number: '✓',
    title: 'Neutral Marketplace',
    body: 'No pay-to-win visibility.',
  },
  {
    number: '✓',
    title: 'Hire & Engage',
    body: 'Hire with milestone-based confidence.',
  },
  {
    number: '✓',
    title: 'Dedicated Workspace',
    body: 'Manage every engagement from start to finish.',
  },
];

const Problem: React.FC = () => {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const [showAll, setShowAll] = useState(false);

  const visibleItems = showAll ? chooseItems : chooseItems.slice(0, 6);

  return (
    <section ref={ref} id="problem" className="mt-section mt-section--white">
      <div className="mt-section__inner">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mt-section__header"
          style={{ marginBottom: '48px' }}
        >
          <span className="mt-eyebrow">Why Us</span>
          <h2 className="mt-h2">
            Why Businesses Choose MarTechAdda
          </h2>
          <p className="mt-lede">
            Discover a neutral discovery, evaluation, and engagement marketplace built exclusively for marketing.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          {visibleItems.map((p, i) => {
            const isLastItem = showAll && i === chooseItems.length - 1;
            const hasRightBorder = !isLastItem && (i + 1) % 3 !== 0;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.15 + (i % 6) * 0.08 }}
                style={{
                  padding: '48px 32px',
                  borderRight: hasRightBorder ? '1px solid rgba(0,0,0,0.06)' : 'none',
                  borderBottom: '1px solid rgba(0,0,0,0.06)',
                }}
                className={`problem-cell ${isLastItem ? 'col-span-1 md:col-span-3' : ''}`}
              >
                <span className="mt-card__index" style={{ color: '#0f8a83', fontSize: '24px', fontWeight: 'bold' }}>
                  {p.number}
                </span>
                <h3 className="mt-card__title">{p.title}</h3>
                <p className="mt-card__body">{p.body}</p>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            marginTop: '56px',
            flexWrap: 'wrap',
          }}
        >
          {!showAll && (
            <button
              onClick={() => setShowAll(true)}
              className="mt-btn mt-btn--secondary"
            >
              Show all
            </button>
          )}
          <Link to="/why-this-works" className="mt-btn mt-btn--primary">
            Why MarTechAdda
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </motion.div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .problem-cell { border-right: none !important; }
        }
      `}</style>
    </section>
  );
};

export default Problem;

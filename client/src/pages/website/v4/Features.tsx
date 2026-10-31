import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Search, Handshake, Briefcase } from 'lucide-react';

const stages = [
  {
    icon: Search,
    name: 'FIND',
    subtitle: 'Discover Relevant Expertise',
    steps: [
      'Select Requirements',
      'Review Matches',
      'Compare & Evaluate',
    ],
  },
  {
    icon: Handshake,
    name: 'HIRE',
    subtitle: 'Hire with Confidence',
    steps: [
      'Connect & Discuss',
      'Review Quotation',
      'Activate Engagement',
    ],
  },
  {
    icon: Briefcase,
    name: 'MANAGE',
    subtitle: 'Manage Every Engagement',
    steps: [
      'Projects & Milestones',
      'Communication',
      'Payments',
    ],
  },
];

const Features: React.FC = () => {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} id="services" className="mt-section mt-section--white features-section">
      <div className="mt-section__inner">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mt-section__header"
        >
          <span className="mt-eyebrow">Workflows</span>
          <h2 className="mt-h2">One Platform. Every Stage.</h2>
          <p className="mt-lede">
            Discover, hire, and collaborate with verified marketing specialists in one unified workspace.
          </p>
        </motion.div>

        <div className="features-stages-grid">
          {stages.map((stage, index) => {
            const Icon = stage.icon;
            return (
              <motion.div
                key={stage.name}
                initial={{ opacity: 0, y: 24 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="stage-card"
              >
                <div className="stage-icon-wrapper">
                  <Icon size={24} />
                </div>
                <span className="stage-name">{stage.name}</span>
                <h3 className="stage-title">{stage.subtitle}</h3>

                <ul className="stage-steps-list">
                  {stage.steps.map((step) => (
                    <li key={step} className="stage-step-item">
                      <span className="stage-step-dot" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

        <div style={{ textAlign: 'center', marginTop: '48px' }}>
          <Link to="/how-it-works" className="mt-btn mt-btn--primary">
            How It Works
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Features;

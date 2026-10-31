import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';

// ─── Data ──────────────────────────────────────────────
const stats = [
  {
    value: '2X',
    label: 'Hiring Clarity',
    color: 'from-orange-50 to-amber-50',
    border: 'border-orange-200',
    accent: 'text-orange-600',
  },
  {
    value: '5X',
    label: 'Discovery Speed',
    color: 'from-purple-50 to-violet-50',
    border: 'border-purple-200',
    accent: 'text-purple-600',
  },
  {
    value: '90%',
    label: 'Alignment Rate',
    color: 'from-emerald-50 to-teal-50',
    border: 'border-emerald-200',
    accent: 'text-emerald-600',
  },
];

const testimonials = [
  {
    quote:
      'MarTechAdda nailed both strategy and execution. They redesigned our site, built a content funnel, and made everything conversion-focused. Super clear, fast, and reliable.',
    name: 'Priya Sharma',
    role: 'Founder, TechScale',
    image:
      'https://framerusercontent.com/images/kmn6EUHVT2ny4zIsDc5ITxJFcpY.png?width=300&height=400',
  },
  {
    quote:
      'MarTechAdda set up my entire course funnel—site, flow, and automations. Smooth process, great team.',
    name: 'Amit Patel',
    role: 'Marketing Director, FinFlow',
    image:
      'https://framerusercontent.com/images/qGE6phPX04ay93NMcVXQ8HrsYGk.png?width=300&height=400',
  },
  {
    quote:
      'MarTechAdda set up my newsletter and video-led content strategy—making our top-of-funnel much stronger. Clear, fast, and effective team.',
    name: 'Joy Chen',
    role: 'Independent Branding Expert',
    image:
      'https://framerusercontent.com/images/MXeu2nP9FKWhFnTD3kdAZLZKNg.png?width=300&height=400',
  },
];

const AUTO_SCROLL_INTERVAL = 5000; // 5 seconds

// ─── Animation Variants ────────────────────────────────
const fadeVariants = {
  enter: { opacity: 0, y: 20, scale: 0.98 },
  center: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.98,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const statVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
};

// ─── Stat Card ─────────────────────────────────────────
const StatCard: React.FC<{ stat: (typeof stats)[0] }> = ({ stat }) => (
  <motion.div
    variants={statVariants}
    className={`relative overflow-hidden rounded-2xl border ${stat.border} bg-gradient-to-br ${stat.color} p-5 flex flex-col justify-between min-h-[120px] group cursor-default`}
  >
    <div className="relative z-10">
      <p className={`text-3xl font-bold ${stat.accent} mb-1`}>{stat.value}</p>
      <p className="text-sm font-medium text-gray-600">{stat.label}</p>
    </div>
    <div
      className={`absolute -bottom-4 -right-4 w-20 h-20 rounded-full opacity-20 bg-gradient-to-br ${stat.color} blur-sm group-hover:scale-110 transition-transform duration-500`}
    />
  </motion.div>
);

// ─── Main Section ──────────────────────────────────────
const Testimonials: React.FC = () => {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % testimonials.length);
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(next, AUTO_SCROLL_INTERVAL);
    return () => clearInterval(timer);
  }, [isPaused, next]);

  const testimonial = testimonials[current];

  return (
    <section
      ref={ref}
      id="testimonials-1"
      className="relative w-full py-20 md:py-28 px-4 md:px-8 lg:px-12"
      style={{ backgroundColor: '#f6f5f4' }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-sm font-medium text-gray-800 shadow-sm border border-gray-100 mb-5">
            <svg
              className="w-3.5 h-3.5 text-orange-500"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Testimonials
          </span>
          <h2
            className="text-3xl md:text-4xl lg:text-[52px] font-medium leading-tight text-gray-900"
            style={{ fontFamily: '"Switzer", "Switzer Placeholder", sans-serif' }}
          >
            What Our Users & Experts Say
          </h2>
        </motion.div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 items-start">
          {/* Stats Column */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            className="grid grid-cols-3 lg:grid-cols-1 gap-4"
          >
            {stats.map((stat, i) => (
              <StatCard key={i} stat={stat} />
            ))}
          </motion.div>

          {/* Carousel */}
          <div
            className="relative w-full"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* Testimonial Card with AnimatePresence */}
            <div className="relative min-h-[280px] md:min-h-[260px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current}
                  variants={fadeVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="absolute inset-0 rounded-2xl border border-gray-100 bg-white p-8 md:p-10 shadow-sm flex flex-col justify-between"
                >
                  {/* Quote icon */}
                  <svg
                    className="absolute top-6 right-6 w-10 h-10 text-orange-100"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zm-14.017 0v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H0z" />
                  </svg>

                  <p className="text-lg md:text-xl font-medium text-gray-800 leading-relaxed relative z-10 mb-8">
                    "{testimonial.quote}"
                  </p>

                  <div className="flex items-center gap-4 mt-auto">
                    <div className="w-12 h-12 rounded-xl overflow-hidden ring-2 ring-gray-100 flex-shrink-0">
                      <img
                        src={testimonial.image}
                        alt={testimonial.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-gray-900">{testimonial.name}</p>
                      <p className="text-sm text-gray-500">{testimonial.role}</p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Dots & Progress */}
            <div className="flex items-center justify-center gap-2 mt-6">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  aria-label={`Go to testimonial ${i + 1}`}
                  className={`relative h-2 rounded-full transition-all duration-300 ${
                    i === current ? 'w-8 bg-orange-400' : 'w-2 bg-gray-300 hover:bg-gray-400'
                  }`}
                >
                  {i === current && !isPaused && (
                    <motion.span
                      className="absolute inset-0 rounded-full bg-orange-500 origin-left"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: AUTO_SCROLL_INTERVAL / 1000, ease: 'linear' }}
                      key={`progress-${current}`}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;

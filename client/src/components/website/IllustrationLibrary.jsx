import React from 'react'

/**
 * Illustration Library - Reusable SVG background illustrations
 * Style: Abstract line art, single line weight, low opacity (8-15%)
 * Colors: Grey (#e5e7eb) with orange/green accents matching brand
 */

// Base SVG wrapper with consistent styling
const BaseIllustration = ({ children, viewBox = "0 0 1200 400", className = "" }) => (
  <svg 
    className={className}
    viewBox={viewBox} 
    preserveAspectRatio="xMidYMid slice" 
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    style={{ 
      width: '100%', 
      height: '100%',
      minHeight: '400px',
      display: 'block',
      opacity: 1,
      pointerEvents: 'none',
      position: 'absolute',
      top: 0,
      left: 0
    }}
  >
    <defs>
      <linearGradient id="orangeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF6B35" stopOpacity="0.2" />
        <stop offset="100%" stopColor="#FF6B35" stopOpacity="0.2" />
      </linearGradient>
      <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2D8659" stopOpacity="0.2" />
        <stop offset="100%" stopColor="#2D8659" stopOpacity="0.2" />
      </linearGradient>
    </defs>
    {children}
  </svg>
)

// HOME PAGE ILLUSTRATIONS

// Hero: Geometric shapes pattern - triangle, circle, hexagon
export const HeroDashboardPattern = () => (
  <BaseIllustration viewBox="0 0 1200 700" className="hero-dashboard-pattern">
    {/* Top left - Triangle - Orange */}
    <path d="M 80 80 L 200 80 L 140 200 Z" fill="none" stroke="#FF6B35" strokeWidth="3" opacity="0.25" />
    <path d="M 100 100 L 180 100 L 140 180 Z" fill="none" stroke="#FF6B35" strokeWidth="2" opacity="0.2" />
    
    {/* Top right - Circle - Green */}
    <circle cx="1120" cy="120" r="50" fill="none" stroke="#2D8659" strokeWidth="3" opacity="0.25" />
    <circle cx="1120" cy="120" r="30" fill="none" stroke="#2D8659" strokeWidth="2" opacity="0.2" />
    
    {/* Bottom left - Triangle (inverted) - Orange */}
    <path d="M 100 500 L 220 500 L 160 380 Z" fill="none" stroke="#FF6B35" strokeWidth="3" opacity="0.25" />
    <path d="M 120 480 L 200 480 L 160 400 Z" fill="none" stroke="#FF6B35" strokeWidth="2" opacity="0.2" />
    
    {/* Bottom right - Hexagon - Green */}
    <path d="M 1120 540 L 1180 520 L 1180 460 L 1120 440 L 1060 460 L 1060 520 Z" fill="none" stroke="#2D8659" strokeWidth="3" opacity="0.25" />
    <path d="M 1120 520 L 1160 510 L 1160 470 L 1120 460 L 1080 470 L 1080 510 Z" fill="none" stroke="#2D8659" strokeWidth="2" opacity="0.2" />
    
    {/* Center decorative elements */}
    <circle cx="200" cy="250" r="12" fill="#FF6B35" opacity="0.15" />
    <circle cx="1000" cy="350" r="12" fill="#2D8659" opacity="0.15" />
    
    {/* Subtle connecting lines */}
    <line x1="140" y1="200" x2="180" y2="240" stroke="#e5e7eb" strokeWidth="1.5" opacity="0.1" />
    <line x1="1060" y1="490" x2="1020" y2="450" stroke="#e5e7eb" strokeWidth="1.5" opacity="0.1" />
    
    {/* Additional accent circles */}
    <circle cx="150" cy="150" r="35" fill="none" stroke="#FF6B35" strokeWidth="2" opacity="0.15" />
    <circle cx="1070" cy="200" r="35" fill="none" stroke="#2D8659" strokeWidth="2" opacity="0.15" />
    <circle cx="180" cy="480" r="30" fill="none" stroke="#FF6B35" strokeWidth="2" opacity="0.15" />
    <circle cx="1090" cy="500" r="30" fill="none" stroke="#2D8659" strokeWidth="2" opacity="0.15" />
  </BaseIllustration>
)

// Service Categories: Service icons in background pattern
export const ServiceCategoryPattern = () => (
  <BaseIllustration viewBox="0 0 1200 500" className="service-category-pattern">
    {/* Grid of service icons */}
    <circle cx="200" cy="150" r="25" fill="none" stroke="#e5e7eb" strokeWidth="2" opacity="0.2" />
    <circle cx="400" cy="120" r="25" fill="none" stroke="#e5e7eb" strokeWidth="2" opacity="0.2" />
    <circle cx="600" cy="180" r="25" fill="none" stroke="#e5e7eb" strokeWidth="2" opacity="0.2" />
    <circle cx="800" cy="140" r="25" fill="none" stroke="#e5e7eb" strokeWidth="2" opacity="0.2" />
    <circle cx="1000" cy="160" r="25" fill="none" stroke="#e5e7eb" strokeWidth="2" opacity="0.2" />
    {/* Connecting lines */}
    <line x1="200" y1="150" x2="400" y2="120" stroke="#e5e7eb" strokeWidth="1.5" opacity="0.15" />
    <line x1="400" y1="120" x2="600" y2="180" stroke="#e5e7eb" strokeWidth="1.5" opacity="0.15" />
    <line x1="600" y1="180" x2="800" y2="140" stroke="#e5e7eb" strokeWidth="1.5" opacity="0.15" />
    {/* Accent dots */}
    <circle cx="300" cy="250" r="4" fill="#FF6B35" opacity="0.2" />
    <circle cx="700" cy="280" r="4" fill="#2D8659" opacity="0.2" />
  </BaseIllustration>
)

// How Hiring Works: Faint timeline arrows connecting steps
export const TimelineArrowsPattern = () => (
  <BaseIllustration viewBox="0 0 1200 400" className="timeline-arrows-pattern">
    {/* Horizontal timeline line */}
    <line x1="100" y1="200" x2="1100" y2="200" stroke="#e5e7eb" strokeWidth="2.5" opacity="0.2" />
    {/* Arrow markers */}
    <path d="M 300 200 L 320 190 L 320 210 Z" fill="#e5e7eb" opacity="0.2" />
    <path d="M 500 200 L 520 190 L 520 210 Z" fill="#e5e7eb" opacity="0.2" />
    <path d="M 700 200 L 720 190 L 720 210 Z" fill="#e5e7eb" opacity="0.2" />
    <path d="M 900 200 L 920 190 L 920 210 Z" fill="#e5e7eb" opacity="0.2" />
    {/* Step nodes */}
    <circle cx="300" cy="200" r="10" fill="#FF6B35" opacity="0.25" />
    <circle cx="500" cy="200" r="10" fill="#e5e7eb" opacity="0.2" />
    <circle cx="700" cy="200" r="10" fill="#e5e7eb" opacity="0.2" />
    <circle cx="900" cy="200" r="10" fill="#2D8659" opacity="0.25" />
  </BaseIllustration>
)

// Problem Cards: Warning triangles in corners
export const WarningTrianglesPattern = () => (
  <BaseIllustration viewBox="0 0 1200 400" className="warning-triangles-pattern">
    {/* Top left corner */}
    <path d="M 50 50 L 80 50 L 65 80 Z" fill="none" stroke="#e5e7eb" strokeWidth="2" opacity="0.2" />
    {/* Top right corner */}
    <path d="M 1150 50 L 1120 50 L 1135 80 Z" fill="none" stroke="#e5e7eb" strokeWidth="2" opacity="0.2" />
    {/* Bottom left corner */}
    <path d="M 50 350 L 80 350 L 65 320 Z" fill="none" stroke="#e5e7eb" strokeWidth="2" opacity="0.2" />
    {/* Bottom right corner */}
    <path d="M 1150 350 L 1120 350 L 1135 320 Z" fill="none" stroke="#e5e7eb" strokeWidth="2" opacity="0.2" />
    {/* Center accent */}
    <circle cx="600" cy="200" r="5" fill="#FF6B35" opacity="0.2" />
  </BaseIllustration>
)

// Solution Cards: Checkmarks + connecting lines
export const CheckmarksPattern = () => (
  <BaseIllustration viewBox="0 0 1200 500" className="checkmarks-pattern">
    {/* Checkmark shapes */}
    <path d="M 200 150 L 220 170 L 250 130" fill="none" stroke="#2D8659" strokeWidth="2.5" opacity="0.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M 500 200 L 520 220 L 550 180" fill="none" stroke="#2D8659" strokeWidth="2.5" opacity="0.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M 800 180 L 820 200 L 850 160" fill="none" stroke="#2D8659" strokeWidth="2.5" opacity="0.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M 1000 160 L 1020 180 L 1050 140" fill="none" stroke="#2D8659" strokeWidth="2.5" opacity="0.2" strokeLinecap="round" strokeLinejoin="round" />
    {/* Connecting lines */}
    <line x1="200" y1="150" x2="500" y2="200" stroke="#e5e7eb" strokeWidth="1.5" opacity="0.15" />
    <line x1="500" y1="200" x2="800" y2="180" stroke="#e5e7eb" strokeWidth="1.5" opacity="0.15" />
    <line x1="800" y1="180" x2="1000" y2="160" stroke="#e5e7eb" strokeWidth="1.5" opacity="0.15" />
  </BaseIllustration>
)

// Dual Paths: Left briefcase shapes, right profile shapes
export const DualPathwaysPattern = () => (
  <BaseIllustration viewBox="0 0 1200 500" className="dual-pathways-pattern">
    {/* Left side - briefcase shapes */}
    <rect x="150" y="150" width="60" height="40" rx="4" fill="none" stroke="#FF6B35" strokeWidth="1.5" opacity="0.1" />
    <rect x="200" y="200" width="50" height="35" rx="4" fill="none" stroke="#FF6B35" strokeWidth="1.5" opacity="0.1" />
    <rect x="250" y="250" width="55" height="38" rx="4" fill="none" stroke="#FF6B35" strokeWidth="1.5" opacity="0.1" />
    {/* Right side - profile shapes */}
    <circle cx="950" cy="150" r="20" fill="none" stroke="#2D8659" strokeWidth="1.5" opacity="0.1" />
    <circle cx="1000" cy="200" r="18" fill="none" stroke="#2D8659" strokeWidth="1.5" opacity="0.1" />
    <circle cx="1050" cy="250" r="22" fill="none" stroke="#2D8659" strokeWidth="1.5" opacity="0.1" />
    {/* Connecting path */}
    <path d="M 300 200 Q 600 100 900 200" fill="none" stroke="#e5e7eb" strokeWidth="1.5" opacity="0.08" />
  </BaseIllustration>
)

// Stats Strip: Number counters in background
export const NumberCountersPattern = () => (
  <BaseIllustration viewBox="0 0 1200 300" className="number-counters-pattern">
    {/* Faint number shapes */}
    <text x="200" y="150" fontSize="60" fill="#e5e7eb" opacity="0.08" fontFamily="Inter, sans-serif" fontWeight="700">500+</text>
    <text x="500" y="150" fontSize="60" fill="#e5e7eb" opacity="0.08" fontFamily="Inter, sans-serif" fontWeight="700">100%</text>
    <text x="800" y="150" fontSize="60" fill="#e5e7eb" opacity="0.08" fontFamily="Inter, sans-serif" fontWeight="700">No</text>
    {/* Accent dots */}
    <circle cx="350" cy="100" r="3" fill="#FF6B35" opacity="0.1" />
    <circle cx="650" cy="200" r="3" fill="#2D8659" opacity="0.1" />
  </BaseIllustration>
)

// Closing CTA: Diagonal gradient lines + subtle shapes
export const DiagonalLinesPattern = () => (
  <BaseIllustration viewBox="0 0 1200 400" className="diagonal-lines-pattern">
    {/* Diagonal lines */}
    <line x1="0" y1="100" x2="1200" y2="300" stroke="#e5e7eb" strokeWidth="1.5" opacity="0.1" />
    <line x1="0" y1="200" x2="1200" y2="400" stroke="#e5e7eb" strokeWidth="1.5" opacity="0.1" />
    <line x1="0" y1="0" x2="1200" y2="200" stroke="#e5e7eb" strokeWidth="1.5" opacity="0.1" />
    {/* Subtle shapes */}
    <circle cx="300" cy="150" r="30" fill="none" stroke="#FF6B35" strokeWidth="1" opacity="0.08" />
    <circle cx="900" cy="250" r="25" fill="none" stroke="#2D8659" strokeWidth="1" opacity="0.08" />
  </BaseIllustration>
)

// ABOUT PAGE ILLUSTRATIONS

// Hero: Platform balance scale (neutrality theme)
export const BalanceScalePattern = () => (
  <BaseIllustration viewBox="0 0 1200 600" className="balance-scale-pattern">
    {/* Balance scale - more prominent */}
    <line x1="600" y1="80" x2="600" y2="350" stroke="#e5e7eb" strokeWidth="3" opacity="0.25" />
    <line x1="350" y1="200" x2="850" y2="200" stroke="#e5e7eb" strokeWidth="3" opacity="0.25" />
    {/* Left pan */}
    <ellipse cx="350" cy="280" rx="100" ry="20" fill="none" stroke="#e5e7eb" strokeWidth="2.5" opacity="0.25" />
    <line x1="350" y1="200" x2="350" y2="280" stroke="#e5e7eb" strokeWidth="2.5" opacity="0.25" />
    {/* Right pan */}
    <ellipse cx="850" cy="280" rx="100" ry="20" fill="none" stroke="#e5e7eb" strokeWidth="2.5" opacity="0.25" />
    <line x1="850" y1="200" x2="850" y2="280" stroke="#e5e7eb" strokeWidth="2.5" opacity="0.25" />
    {/* Accent dots - more visible */}
    <circle cx="350" cy="280" r="6" fill="#FF6B35" opacity="0.3" />
    <circle cx="850" cy="280" r="6" fill="#2D8659" opacity="0.3" />
    {/* Additional decorative elements */}
    <circle cx="200" cy="150" r="30" fill="none" stroke="#FF6B35" strokeWidth="2" opacity="0.15" />
    <circle cx="1000" cy="150" r="30" fill="none" stroke="#2D8659" strokeWidth="2" opacity="0.15" />
    {/* Connecting lines */}
    <path d="M 230 150 Q 400 180 350 200" fill="none" stroke="#e5e7eb" strokeWidth="1.5" opacity="0.2" />
    <path d="M 970 150 Q 800 180 850 200" fill="none" stroke="#e5e7eb" strokeWidth="1.5" opacity="0.2" />
  </BaseIllustration>
)

// Why We Exist: Problem flow diagram background
export const ProblemFlowPattern = () => (
  <BaseIllustration viewBox="0 0 1200 500" className="problem-flow-pattern">
    {/* Flow diagram nodes */}
    <circle cx="200" cy="200" r="15" fill="none" stroke="#e5e7eb" strokeWidth="1.5" opacity="0.1" />
    <circle cx="500" cy="150" r="15" fill="none" stroke="#e5e7eb" strokeWidth="1.5" opacity="0.1" />
    <circle cx="800" cy="250" r="15" fill="none" stroke="#e5e7eb" strokeWidth="1.5" opacity="0.1" />
    <circle cx="1000" cy="200" r="15" fill="none" stroke="#e5e7eb" strokeWidth="1.5" opacity="0.1" />
    {/* Connecting arrows */}
    <path d="M 215 200 L 485 150" stroke="#e5e7eb" strokeWidth="1.5" opacity="0.08" fill="none" />
    <path d="M 515 150 L 785 250" stroke="#e5e7eb" strokeWidth="1.5" opacity="0.08" fill="none" />
    <path d="M 815 250 L 985 200" stroke="#e5e7eb" strokeWidth="1.5" opacity="0.08" fill="none" />
    {/* Arrow heads */}
    <path d="M 485 150 L 475 145 L 475 155 Z" fill="#e5e7eb" opacity="0.08" />
    <path d="M 785 250 L 775 245 L 775 255 Z" fill="#e5e7eb" opacity="0.08" />
    <path d="M 985 200 L 975 195 L 975 205 Z" fill="#e5e7eb" opacity="0.08" />
  </BaseIllustration>
)

// What We're Building: Blueprint/construction lines - enhanced and filled
export const BlueprintPattern = () => (
  <BaseIllustration viewBox="0 0 1200 600" className="blueprint-pattern">
    {/* Grid lines - more visible */}
    <line x1="0" y1="100" x2="1200" y2="100" stroke="#e5e7eb" strokeWidth="2" opacity="0.2" />
    <line x1="0" y1="200" x2="1200" y2="200" stroke="#e5e7eb" strokeWidth="2" opacity="0.2" />
    <line x1="0" y1="300" x2="1200" y2="300" stroke="#e5e7eb" strokeWidth="2" opacity="0.2" />
    <line x1="0" y1="400" x2="1200" y2="400" stroke="#e5e7eb" strokeWidth="2" opacity="0.2" />
    <line x1="0" y1="500" x2="1200" y2="500" stroke="#e5e7eb" strokeWidth="2" opacity="0.2" />
    <line x1="0" y1="0" x2="0" y2="600" stroke="#e5e7eb" strokeWidth="2" opacity="0.2" />
    <line x1="200" y1="0" x2="200" y2="600" stroke="#e5e7eb" strokeWidth="2" opacity="0.2" />
    <line x1="400" y1="0" x2="400" y2="600" stroke="#e5e7eb" strokeWidth="2" opacity="0.2" />
    <line x1="600" y1="0" x2="600" y2="600" stroke="#e5e7eb" strokeWidth="2" opacity="0.2" />
    <line x1="800" y1="0" x2="800" y2="600" stroke="#e5e7eb" strokeWidth="2" opacity="0.2" />
    <line x1="1000" y1="0" x2="1000" y2="600" stroke="#e5e7eb" strokeWidth="2" opacity="0.2" />
    <line x1="1200" y1="0" x2="1200" y2="600" stroke="#e5e7eb" strokeWidth="2" opacity="0.2" />
    {/* Diagonal grid lines for depth */}
    <line x1="0" y1="0" x2="1200" y2="600" stroke="#e5e7eb" strokeWidth="1" opacity="0.15" />
    <line x1="1200" y1="0" x2="0" y2="600" stroke="#e5e7eb" strokeWidth="1" opacity="0.15" />
    {/* Construction shapes - larger and more visible */}
    <rect x="150" y="120" width="120" height="100" rx="4" fill="none" stroke="#FF6B35" strokeWidth="3" opacity="0.25" />
    <rect x="450" y="150" width="120" height="100" rx="4" fill="none" stroke="#2D8659" strokeWidth="3" opacity="0.25" />
    <rect x="750" y="180" width="120" height="100" rx="4" fill="none" stroke="#FF6B35" strokeWidth="3" opacity="0.25" />
    <rect x="1050" y="140" width="120" height="100" rx="4" fill="none" stroke="#2D8659" strokeWidth="3" opacity="0.25" />
    {/* Additional construction elements */}
    <circle cx="300" cy="350" r="30" fill="none" stroke="#FF6B35" strokeWidth="2.5" opacity="0.2" />
    <circle cx="900" cy="380" r="30" fill="none" stroke="#2D8659" strokeWidth="2.5" opacity="0.2" />
    {/* Measurement lines */}
    <line x1="150" y1="230" x2="270" y2="230" stroke="#e5e7eb" strokeWidth="1.5" opacity="0.15" />
    <line x1="450" y1="260" x2="570" y2="260" stroke="#e5e7eb" strokeWidth="1.5" opacity="0.15" />
    {/* Corner brackets */}
    <path d="M 100 100 L 120 100 L 120 120 L 100 120" fill="none" stroke="#e5e7eb" strokeWidth="2" opacity="0.15" />
    <path d="M 1100 100 L 1120 100 L 1120 120 L 1100 120" fill="none" stroke="#e5e7eb" strokeWidth="2" opacity="0.15" />
    <path d="M 100 480 L 120 480 L 120 500 L 100 500" fill="none" stroke="#e5e7eb" strokeWidth="2" opacity="0.15" />
    <path d="M 1100 480 L 1120 480 L 1120 500 L 1100 500" fill="none" stroke="#e5e7eb" strokeWidth="2" opacity="0.15" />
    {/* Additional blueprint elements */}
    <path d="M 200 250 L 220 250 L 220 270 L 200 270 Z" fill="none" stroke="#FF6B35" strokeWidth="2" opacity="0.2" />
    <path d="M 1000 250 L 1020 250 L 1020 270 L 1000 270 Z" fill="none" stroke="#2D8659" strokeWidth="2" opacity="0.2" />
  </BaseIllustration>
)

// Principles: 4 corner geometric shapes - larger and more visible
export const GeometricShapesPattern = () => (
  <BaseIllustration viewBox="0 0 1200 600" className="geometric-shapes-pattern">
    {/* Top left - triangle - larger */}
    <path d="M 80 80 L 180 80 L 130 180 Z" fill="none" stroke="#FF6B35" strokeWidth="3" opacity="0.25" />
    <path d="M 100 100 L 160 100 L 130 160 Z" fill="none" stroke="#FF6B35" strokeWidth="2" opacity="0.2" />
    {/* Top right - circle - larger */}
    <circle cx="1120" cy="100" r="40" fill="none" stroke="#2D8659" strokeWidth="3" opacity="0.25" />
    <circle cx="1120" cy="100" r="25" fill="none" stroke="#2D8659" strokeWidth="2" opacity="0.2" />
    {/* Bottom left - square - larger */}
    <rect x="80" y="380" width="80" height="80" rx="4" fill="none" stroke="#FF6B35" strokeWidth="3" opacity="0.25" />
    <rect x="100" y="400" width="40" height="40" rx="2" fill="none" stroke="#FF6B35" strokeWidth="2" opacity="0.2" />
    {/* Bottom right - hexagon - larger */}
    <path d="M 1120 420 L 1160 400 L 1160 360 L 1120 340 L 1080 360 L 1080 400 Z" fill="none" stroke="#2D8659" strokeWidth="3" opacity="0.25" />
    <path d="M 1120 400 L 1140 390 L 1140 370 L 1120 360 L 1100 370 L 1100 390 Z" fill="none" stroke="#2D8659" strokeWidth="2" opacity="0.2" />
    {/* Additional decorative elements for depth */}
    <circle cx="150" cy="120" r="8" fill="#FF6B35" opacity="0.2" />
    <circle cx="1080" cy="120" r="8" fill="#2D8659" opacity="0.2" />
    <circle cx="150" cy="420" r="8" fill="#FF6B35" opacity="0.2" />
    <circle cx="1080" cy="420" r="8" fill="#2D8659" opacity="0.2" />
    {/* Connecting subtle lines */}
    <line x1="130" y1="180" x2="150" y2="200" stroke="#e5e7eb" strokeWidth="1.5" opacity="0.15" />
    <line x1="1080" y1="140" x2="1060" y2="160" stroke="#e5e7eb" strokeWidth="1.5" opacity="0.15" />
  </BaseIllustration>
)

// Ecosystem Role: Node connection network faint bg - focused on corners
export const NodeNetworkPattern = () => (
  <BaseIllustration viewBox="0 0 1200 500" className="node-network-pattern">
    {/* Left corner cluster - Businesses theme */}
    <circle cx="150" cy="150" r="25" fill="#FF6B35" opacity="0.25" />
    <circle cx="100" cy="200" r="20" fill="#e5e7eb" opacity="0.2" />
    <circle cx="200" cy="250" r="18" fill="#e5e7eb" opacity="0.2" />
    {/* Left corner outer rings */}
    <circle cx="150" cy="150" r="40" fill="none" stroke="#FF6B35" strokeWidth="2.5" opacity="0.2" />
    <circle cx="100" cy="200" r="35" fill="none" stroke="#e5e7eb" strokeWidth="2" opacity="0.15" />
    {/* Left corner connecting lines */}
    <line x1="150" y1="150" x2="100" y2="200" stroke="#e5e7eb" strokeWidth="2" opacity="0.2" />
    <line x1="100" y1="200" x2="200" y2="250" stroke="#e5e7eb" strokeWidth="2" opacity="0.2" />
    <line x1="150" y1="150" x2="200" y2="250" stroke="#FF6B35" strokeWidth="2" opacity="0.15" />
    {/* Left corner decorative arcs */}
    <path d="M 50 100 Q 100 120 150 150" fill="none" stroke="#FF6B35" strokeWidth="2" opacity="0.15" />
    <path d="M 50 300 Q 100 250 150 200" fill="none" stroke="#e5e7eb" strokeWidth="1.5" opacity="0.15" />
    
    {/* Right corner cluster - Experts theme */}
    <circle cx="1050" cy="150" r="25" fill="#2D8659" opacity="0.25" />
    <circle cx="1100" cy="200" r="20" fill="#e5e7eb" opacity="0.2" />
    <circle cx="1000" cy="250" r="18" fill="#e5e7eb" opacity="0.2" />
    {/* Right corner outer rings */}
    <circle cx="1050" cy="150" r="40" fill="none" stroke="#2D8659" strokeWidth="2.5" opacity="0.2" />
    <circle cx="1100" cy="200" r="35" fill="none" stroke="#e5e7eb" strokeWidth="2" opacity="0.15" />
    {/* Right corner connecting lines */}
    <line x1="1050" y1="150" x2="1100" y2="200" stroke="#e5e7eb" strokeWidth="2" opacity="0.2" />
    <line x1="1100" y1="200" x2="1000" y2="250" stroke="#e5e7eb" strokeWidth="2" opacity="0.2" />
    <line x1="1050" y1="150" x2="1000" y2="250" stroke="#2D8659" strokeWidth="2" opacity="0.15" />
    {/* Right corner decorative arcs */}
    <path d="M 1150 100 Q 1100 120 1050 150" fill="none" stroke="#2D8659" strokeWidth="2" opacity="0.15" />
    <path d="M 1150 300 Q 1100 250 1050 200" fill="none" stroke="#e5e7eb" strokeWidth="1.5" opacity="0.15" />
    
    {/* Top corners - subtle elements */}
    <circle cx="80" cy="80" r="15" fill="none" stroke="#FF6B35" strokeWidth="1.5" opacity="0.15" />
    <circle cx="1120" cy="80" r="15" fill="none" stroke="#2D8659" strokeWidth="1.5" opacity="0.15" />
    
    {/* Bottom corners - subtle elements */}
    <circle cx="80" cy="420" r="15" fill="none" stroke="#FF6B35" strokeWidth="1.5" opacity="0.15" />
    <circle cx="1120" cy="420" r="15" fill="none" stroke="#2D8659" strokeWidth="1.5" opacity="0.15" />
  </BaseIllustration>
)

// HOW IT WORKS PAGE ILLUSTRATIONS

// Hero: Process flow arrows/nodes
export const ProcessFlowPattern = () => (
  <BaseIllustration viewBox="0 0 1200 400" className="process-flow-pattern">
    {/* Flow nodes */}
    <circle cx="200" cy="200" r="12" fill="#FF6B35" opacity="0.12" />
    <circle cx="450" cy="200" r="12" fill="#e5e7eb" opacity="0.1" />
    <circle cx="700" cy="200" r="12" fill="#e5e7eb" opacity="0.1" />
    <circle cx="950" cy="200" r="12" fill="#2D8659" opacity="0.12" />
    {/* Connecting arrows */}
    <path d="M 212 200 L 438 200" stroke="#e5e7eb" strokeWidth="2" opacity="0.1" fill="none" />
    <path d="M 462 200 L 688 200" stroke="#e5e7eb" strokeWidth="2" opacity="0.1" fill="none" />
    <path d="M 712 200 L 938 200" stroke="#e5e7eb" strokeWidth="2" opacity="0.1" fill="none" />
    {/* Arrow heads */}
    <path d="M 438 200 L 428 195 L 428 205 Z" fill="#e5e7eb" opacity="0.1" />
    <path d="M 688 200 L 678 195 L 678 205 Z" fill="#e5e7eb" opacity="0.1" />
    <path d="M 938 200 L 928 195 L 928 205 Z" fill="#e5e7eb" opacity="0.1" />
  </BaseIllustration>
)

// Businesses Stepper: Filter icons floating
export const FilterIconsPattern = () => (
  <BaseIllustration viewBox="0 0 1200 600" className="filter-icons-pattern">
    {/* Filter icon shapes */}
    <rect x="200" y="150" width="40" height="40" rx="4" fill="none" stroke="#FF6B35" strokeWidth="1.5" opacity="0.1" />
    <line x1="220" y1="170" x2="240" y2="170" stroke="#FF6B35" strokeWidth="1.5" opacity="0.1" />
    <line x1="220" y1="180" x2="235" y2="180" stroke="#FF6B35" strokeWidth="1.5" opacity="0.1" />
    
    <rect x="500" y="200" width="40" height="40" rx="4" fill="none" stroke="#e5e7eb" strokeWidth="1.5" opacity="0.1" />
    <line x1="520" y1="220" x2="540" y2="220" stroke="#e5e7eb" strokeWidth="1.5" opacity="0.1" />
    <line x1="520" y1="230" x2="535" y2="230" stroke="#e5e7eb" strokeWidth="1.5" opacity="0.1" />
    
    <rect x="800" y="250" width="40" height="40" rx="4" fill="none" stroke="#2D8659" strokeWidth="1.5" opacity="0.1" />
    <line x1="820" y1="270" x2="840" y2="270" stroke="#2D8659" strokeWidth="1.5" opacity="0.1" />
    <line x1="820" y1="280" x2="835" y2="280" stroke="#2D8659" strokeWidth="1.5" opacity="0.1" />
  </BaseIllustration>
)

// Experts Stepper: Profile/target icons
export const ProfileTargetPattern = () => (
  <BaseIllustration viewBox="0 0 1200 600" className="profile-target-pattern">
    {/* Profile icons */}
    <circle cx="200" cy="200" r="20" fill="none" stroke="#FF6B35" strokeWidth="1.5" opacity="0.1" />
    <circle cx="200" cy="180" r="8" fill="none" stroke="#FF6B35" strokeWidth="1.5" opacity="0.1" />
    
    {/* Target icons */}
    <circle cx="500" cy="250" r="25" fill="none" stroke="#e5e7eb" strokeWidth="1.5" opacity="0.1" />
    <circle cx="500" cy="250" r="15" fill="none" stroke="#e5e7eb" strokeWidth="1.5" opacity="0.1" />
    <circle cx="500" cy="250" r="5" fill="#e5e7eb" opacity="0.1" />
    
    <circle cx="800" cy="200" r="20" fill="none" stroke="#2D8659" strokeWidth="1.5" opacity="0.1" />
    <circle cx="800" cy="180" r="8" fill="none" stroke="#2D8659" strokeWidth="1.5" opacity="0.1" />
  </BaseIllustration>
)

// What We Don't Do: Lock/shield pattern bg
export const LockShieldPattern = () => (
  <BaseIllustration viewBox="0 0 1200 400" className="lock-shield-pattern">
    {/* Lock shapes */}
    <rect x="200" y="150" width="30" height="40" rx="4" fill="none" stroke="#e5e7eb" strokeWidth="1.5" opacity="0.1" />
    <circle cx="215" cy="165" r="8" fill="none" stroke="#e5e7eb" strokeWidth="1.5" opacity="0.1" />
    
    {/* Shield shapes */}
    <path d="M 500 140 Q 500 120 520 120 Q 540 120 540 140 L 540 180 Q 540 200 520 200 Q 500 200 500 180 Z" fill="none" stroke="#e5e7eb" strokeWidth="1.5" opacity="0.1" />
    
    <rect x="800" y="150" width="30" height="40" rx="4" fill="none" stroke="#e5e7eb" strokeWidth="1.5" opacity="0.1" />
    <circle cx="815" cy="165" r="8" fill="none" stroke="#e5e7eb" strokeWidth="1.5" opacity="0.1" />
  </BaseIllustration>
)

// WHY THIS WORKS PAGE ILLUSTRATIONS

// Hero: Lightbulb + insight charts
export const LightbulbChartsPattern = () => (
  <BaseIllustration viewBox="0 0 1200 400" className="lightbulb-charts-pattern">
    {/* Lightbulb shape */}
    <circle cx="300" cy="150" r="25" fill="none" stroke="#FF6B35" strokeWidth="1.5" opacity="0.1" />
    <rect x="290" y="175" width="20" height="15" rx="2" fill="none" stroke="#FF6B35" strokeWidth="1.5" opacity="0.1" />
    {/* Chart bars */}
    <rect x="600" y="180" width="20" height="40" fill="#e5e7eb" opacity="0.1" />
    <rect x="640" y="160" width="20" height="60" fill="#e5e7eb" opacity="0.1" />
    <rect x="680" y="140" width="20" height="80" fill="#2D8659" opacity="0.12" />
    <rect x="720" y="170" width="20" height="50" fill="#e5e7eb" opacity="0.1" />
  </BaseIllustration>
)

// Core Insight: Problem→Solution arrow flow
export const ProblemSolutionFlowPattern = () => (
  <BaseIllustration viewBox="0 0 1200 400" className="problem-solution-flow-pattern">
    {/* Problem node */}
    <circle cx="200" cy="200" r="20" fill="none" stroke="#e5e7eb" strokeWidth="2" opacity="0.1" />
    <path d="M 200 180 L 200 200 L 190 200 L 200 220 Z" fill="#e5e7eb" opacity="0.1" />
    {/* Arrow to solution */}
    <path d="M 230 200 L 700 200" stroke="#e5e7eb" strokeWidth="2" opacity="0.1" fill="none" />
    <path d="M 700 200 L 690 195 L 690 205 Z" fill="#e5e7eb" opacity="0.1" />
    {/* Solution node */}
    <circle cx="1000" cy="200" r="20" fill="none" stroke="#2D8659" strokeWidth="2" opacity="0.12" />
    <path d="M 1000 180 L 1000 200 L 990 200 L 1000 220 Z" fill="#2D8659" opacity="0.12" />
  </BaseIllustration>
)

// Structural Issues: Cracked foundation shapes
export const CrackedFoundationPattern = () => (
  <BaseIllustration viewBox="0 0 1200 400" className="cracked-foundation-pattern">
    {/* Foundation block */}
    <rect x="300" y="250" width="600" height="100" fill="none" stroke="#e5e7eb" strokeWidth="2" opacity="0.1" />
    {/* Crack lines */}
    <path d="M 500 250 L 520 300 L 540 280" stroke="#e5e7eb" strokeWidth="1.5" opacity="0.1" fill="none" />
    <path d="M 700 250 L 680 300 L 660 280" stroke="#e5e7eb" strokeWidth="1.5" opacity="0.1" fill="none" />
  </BaseIllustration>
)

// Expertise Areas: Service category icons faint
export const ServiceIconsFaintPattern = () => (
  <BaseIllustration viewBox="0 0 1200 400" className="service-icons-faint-pattern">
    {/* Service icon shapes */}
    <circle cx="200" cy="200" r="20" fill="none" stroke="#e5e7eb" strokeWidth="1.5" opacity="0.08" />
    <rect x="450" y="180" width="40" height="40" rx="4" fill="none" stroke="#e5e7eb" strokeWidth="1.5" opacity="0.08" />
    <path d="M 700 200 L 720 180 L 740 200 L 720 220 Z" fill="none" stroke="#e5e7eb" strokeWidth="1.5" opacity="0.08" />
    <rect x="950" y="180" width="40" height="40" fill="none" stroke="#e5e7eb" strokeWidth="1.5" opacity="0.08" />
  </BaseIllustration>
)

// CONTACT PAGE ILLUSTRATIONS

// Hero: Chat bubbles/support headset
export const ChatBubblesPattern = () => (
  <BaseIllustration viewBox="0 0 1200 400" className="chat-bubbles-pattern">
    {/* Chat bubbles */}
    <ellipse cx="300" cy="150" rx="40" ry="30" fill="none" stroke="#e5e7eb" strokeWidth="1.5" opacity="0.1" />
    <path d="M 280 170 L 300 180 L 320 170" fill="none" stroke="#e5e7eb" strokeWidth="1.5" opacity="0.1" />
    
    <ellipse cx="700" cy="200" rx="50" ry="35" fill="none" stroke="#e5e7eb" strokeWidth="1.5" opacity="0.1" />
    <path d="M 680 220 L 700 230 L 720 220" fill="none" stroke="#e5e7eb" strokeWidth="1.5" opacity="0.1" />
    
    <ellipse cx="1000" cy="180" rx="45" ry="32" fill="none" stroke="#e5e7eb" strokeWidth="1.5" opacity="0.1" />
    <path d="M 980 200 L 1000 210 L 1020 200" fill="none" stroke="#e5e7eb" strokeWidth="1.5" opacity="0.1" />
  </BaseIllustration>
)

// Step Progress: Arrow timeline background
export const StepTimelinePattern = () => (
  <BaseIllustration viewBox="0 0 1200 300" className="step-timeline-pattern">
    {/* Timeline line */}
    <line x1="150" y1="150" x2="1050" y2="150" stroke="#e5e7eb" strokeWidth="2" opacity="0.1" />
    {/* Step nodes */}
    <circle cx="250" cy="150" r="8" fill="#FF6B35" opacity="0.12" />
    <circle cx="450" cy="150" r="8" fill="#e5e7eb" opacity="0.1" />
    <circle cx="650" cy="150" r="8" fill="#e5e7eb" opacity="0.1" />
    <circle cx="850" cy="150" r="8" fill="#2D8659" opacity="0.12" />
    {/* Arrow markers */}
    <path d="M 350 150 L 370 140 L 370 160 Z" fill="#e5e7eb" opacity="0.1" />
    <path d="M 550 150 L 570 140 L 570 160 Z" fill="#e5e7eb" opacity="0.1" />
    <path d="M 750 150 L 770 140 L 770 160 Z" fill="#e5e7eb" opacity="0.1" />
  </BaseIllustration>
)

// Role Cards: Person/avatar shapes
export const PersonAvatarPattern = () => (
  <BaseIllustration viewBox="0 0 1200 400" className="person-avatar-pattern">
    {/* Avatar shapes */}
    <circle cx="300" cy="200" r="25" fill="none" stroke="#FF6B35" strokeWidth="1.5" opacity="0.1" />
    <circle cx="300" cy="180" r="8" fill="none" stroke="#FF6B35" strokeWidth="1.5" opacity="0.1" />
    
    <circle cx="600" cy="200" r="25" fill="none" stroke="#e5e7eb" strokeWidth="1.5" opacity="0.1" />
    <circle cx="600" cy="180" r="8" fill="none" stroke="#e5e7eb" strokeWidth="1.5" opacity="0.1" />
    
    <circle cx="900" cy="200" r="25" fill="none" stroke="#2D8659" strokeWidth="1.5" opacity="0.1" />
    <circle cx="900" cy="180" r="8" fill="none" stroke="#2D8659" strokeWidth="1.5" opacity="0.1" />
  </BaseIllustration>
)

// Trust Block: Lock + shield pattern
export const TrustLockShieldPattern = () => (
  <BaseIllustration viewBox="0 0 1200 300" className="trust-lock-shield-pattern">
    {/* Lock shapes */}
    <rect x="300" y="100" width="30" height="40" rx="4" fill="none" stroke="#e5e7eb" strokeWidth="1.5" opacity="0.1" />
    <circle cx="315" cy="115" r="8" fill="none" stroke="#e5e7eb" strokeWidth="1.5" opacity="0.1" />
    
    {/* Shield shapes */}
    <path d="M 600 90 Q 600 70 620 70 Q 640 70 640 90 L 640 130 Q 640 150 620 150 Q 600 150 600 130 Z" fill="none" stroke="#e5e7eb" strokeWidth="1.5" opacity="0.1" />
    
    <rect x="900" y="100" width="30" height="40" rx="4" fill="none" stroke="#e5e7eb" strokeWidth="1.5" opacity="0.1" />
    <circle cx="915" cy="115" r="8" fill="none" stroke="#e5e7eb" strokeWidth="1.5" opacity="0.1" />
  </BaseIllustration>
)

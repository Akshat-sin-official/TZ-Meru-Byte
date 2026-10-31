import React from 'react'
import { FiFlag, FiTarget, FiFileText, FiSearch, FiCheckCircle, FiUser } from 'react-icons/fi'
import { MegaphoneIcon, PaletteIcon, ChartIcon, GearIcon } from './Icons'
import SectionWrapper from './SectionWrapper'
import Button from './ui/Button'
import { useNavigate } from 'react-router-dom'
import styles from './ServiceCategories.module.css'

// Service Tile Component for left side
const ServiceTile = ({ icon: Icon, title, description, onClick }) => {
  return (
    <div className={styles.serviceTile} onClick={onClick}>
      <div className={styles.serviceTileIcon}>
        <Icon className={styles.tileIcon} />
      </div>
      <div className={styles.serviceTileContent}>
        <h3 className={styles.serviceTileTitle}>{title}</h3>
        <p className={styles.serviceTileDescription}>{description}</p>
      </div>
    </div>
  )
}

// Service Providers Card Component for right side
const ServiceProvidersCard = () => {
  const expertBullets = [
    "Create a verified professional profile",
    "Get discovered for capability, not ad spend",
    "Relevant business requirements come to you based on your expertise."
  ]

  return (
    <div className={styles.serviceProvidersCard}>
      <div className={styles.cardIconContainer}>
        <FiUser className={styles.cardIcon} />
      </div>

      <h2 className={styles.cardTitle}>For Marketing Experts</h2>

      <ul className={styles.cardBulletList}>
        {expertBullets.map((bullet, index) => (
          <li key={index} className={styles.cardBulletItem}>
            <FiCheckCircle className={styles.cardCheckIcon} />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>

      <div className={styles.trustBuilder}>
        <p className={styles.trustBuilderText}>
          Profiles are reviewed before visibility — relevance and quality come before reach.
        </p>
      </div>

      <Button
        variant="secondary"
        size="lg"
        className={styles.cardCtaButton}
        to="/service-expert-register"
      >
        Join as Marketing Expert
      </Button>
    </div>
  )
}

const ServiceCategories = () => {
  const navigate = useNavigate()
  const serviceTiles = [
    {
      icon: PaletteIcon,
      title: 'Branding',
      description: 'Select the branding outcomes you need — not how they are executed.',
      category: 'Branding Services'
    },
    {
      icon: ChartIcon,
      title: 'Strategic Marketing',
      description: 'Select what you need help planning, not executing.',
      category: 'Strategic Marketing Services'
    },
    {
      icon: MegaphoneIcon,
      title: 'Advertising',
      description: 'Select the advertising formats you want to run — not the tools or platforms.',
      category: 'Advertising Services'
    },
    {
      icon: GearIcon,
      title: 'Marketing collateral',
      description: 'Select the types of marketing assets you need — not the tools used to create them.',
      category: 'Marketing Collateral Services'
    }
  ]

  const handleTileClick = (category) => {
    // Navigate to experts page with category filter
    const categoryParam = encodeURIComponent(category)
    navigate(`/experts?category=${categoryParam}`)
  }

  return (
    <SectionWrapper sectionType="service-categories">
      <section className={styles.serviceCategories}>
        <div className={`container ${styles.container}`}>
          <div className={styles.twoColumnLayout}>
            {/* Left Side - Find Marketing Experts */}
            <div className={styles.leftColumn}>
              <div className={styles.findExpertsSection}>
                <div className={styles.findExpertsHeader}>
                  <FiSearch className={styles.searchIcon} />
                  <h3 className={styles.findExpertsTitle}>Find Marketing Experts</h3>
                </div>

                <div className={styles.findExpertsIntro}>
                  <p className={styles.findExpertsSubheading}>I'm looking for</p>
                  <p className={styles.findExpertsInstruction}>Choose a service to begin</p>
                  <p className={styles.findExpertsDescription}>
                    Start with your business requirements. We help you discover relevant expertise — not just visible profiles.
                  </p>
                </div>

                <div className={styles.serviceTilesList}>
                  {serviceTiles.map((tile, index) => (
                    <ServiceTile
                      key={index}
                      icon={tile.icon}
                      title={tile.title}
                      description={tile.description}
                      onClick={() => handleTileClick(tile.category)}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Right Side - Service Providers Card */}
            <div className={styles.rightColumn}>
              <ServiceProvidersCard />
            </div>
          </div>
        </div>
      </section>
    </SectionWrapper>
  )
}

export default ServiceCategories

import React from 'react'
import Card from './Card'
import { FiLink, FiImage, FiX } from 'react-icons/fi'
import styles from './PortfolioCard.module.css'

const PortfolioCard = ({ item, index, onRemove, onChange, showRemove = true }) => {
  return (
    <Card className={styles.portfolioCard}>
      <div className={styles.portfolioHeader}>
        <div className={styles.portfolioNumber}>Project {index + 1}</div>
        {showRemove && (
          <button
            type="button"
            className={styles.removeButton}
            onClick={onRemove}
            aria-label="Remove project"
          >
            <FiX />
          </button>
        )}
      </div>
      
      <div className={styles.portfolioImagePlaceholder}>
        <FiImage className={styles.imageIcon} />
        <span className={styles.imageText}>Add project image</span>
        <input
          type="file"
          accept="image/*"
          className={styles.imageInput}
          onChange={(e) => {
            if (e.target.files[0]) {
              onChange('image', URL.createObjectURL(e.target.files[0]))
            }
          }}
        />
      </div>

      <div className={styles.portfolioForm}>
        <input
          type="text"
          placeholder="Project Title"
          value={item.title || ''}
          onChange={(e) => onChange('title', e.target.value)}
          className={styles.portfolioInput}
        />
        <textarea
          placeholder="Description and results..."
          value={item.description || ''}
          onChange={(e) => onChange('description', e.target.value)}
          className={styles.portfolioTextarea}
          rows="3"
        />
        <div className={styles.portfolioLink}>
          <FiLink className={styles.linkIcon} />
          <input
            type="url"
            placeholder="Project URL (optional)"
            value={item.link || ''}
            onChange={(e) => onChange('link', e.target.value)}
            className={styles.portfolioInput}
          />
        </div>
      </div>
    </Card>
  )
}

export default PortfolioCard

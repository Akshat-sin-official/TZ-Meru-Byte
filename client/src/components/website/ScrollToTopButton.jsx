import React, { useState, useEffect } from 'react'
import { FiArrowUp } from 'react-icons/fi'
import styles from './ScrollToTopButton.module.css'

const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener('scroll', toggleVisibility)

    return () => {
      window.removeEventListener('scroll', toggleVisibility)
    }
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          className={styles.scrollToTopButton}
          aria-label="Scroll to top"
        >
          <FiArrowUp className={styles.icon} />
        </button>
      )}
    </>
  )
}

export default ScrollToTopButton

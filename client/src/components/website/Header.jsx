import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FiFacebook, FiLinkedin, FiInstagram, FiLogIn, FiUser, FiChevronDown, FiLogOut, FiLayout, FiClock, FiFileText } from 'react-icons/fi'
import { useAuth } from '@/contexts/AuthContext'
import Button from './ui/Button'
import Logo from './Logo'
import styles from './Header.module.css'

const getWebsiteUrl = (path = '') => {
  const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const baseUrl = isLocal ? 'http://localhost:5174' : 'https://martechadda.com';
  return `${baseUrl}${path.startsWith('/') ? path : '/' + path}`;
};

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [isAtTop, setIsAtTop] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, logout, getDashboardPath } = useAuth()

  useEffect(() => {
    let inactivityTimeout
    let scrollTimeout
    let ticking = false

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY
          const scrollDirection = currentScrollY > lastScrollY ? 'down' : 'up'

          // Check if at top of page
          const atTop = currentScrollY === 0 || currentScrollY < 10
          setIsAtTop(atTop)
          setIsScrolled(currentScrollY > 20)

          // Clear existing timeouts
          clearTimeout(scrollTimeout)
          clearTimeout(inactivityTimeout)

          if (atTop) {
            // At top: show navbar, but it's static (not sticky)
            setIsVisible(true)
          } else {
            // Not at top: show/hide based on scroll direction
            if (scrollDirection === 'down') {
              // Scrolling down: show navbar with fade-in
              setIsVisible(true)
            } else {
              // Scrolling up: hide navbar
              setIsVisible(false)
            }

            // Hide after 3 seconds of inactivity (no scrolling)
            inactivityTimeout = setTimeout(() => {
              if (!atTop) {
                setIsVisible(false)
              }
            }, 3000)
          }

          setLastScrollY(currentScrollY)
          ticking = false
        })
        ticking = true
      }
    }

    // Handle user interactions (mouse move, click, touch, keyboard)
    const handleUserInteraction = (e) => {
      // Don't trigger visibility changes when typing in input fields
      if (e && e.target && (
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA' ||
        e.target.tagName === 'SELECT' ||
        e.target.isContentEditable
      )) {
        return
      }

      if (!isAtTop) {
        setIsVisible(true)
        clearTimeout(inactivityTimeout)

        // Hide after 3 seconds of inactivity
        inactivityTimeout = setTimeout(() => {
          setIsVisible(false)
        }, 3000)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('mousemove', handleUserInteraction, { passive: true })
    window.addEventListener('click', handleUserInteraction, { passive: true })
    window.addEventListener('touchstart', handleUserInteraction, { passive: true })
    // Only listen to keydown for non-input keys (like Escape, Arrow keys for navigation)
    window.addEventListener('keydown', (e) => {
      // Only handle non-input keys
      if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName) && !e.target?.isContentEditable) {
        handleUserInteraction(e)
      }
    }, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('mousemove', handleUserInteraction)
      window.removeEventListener('click', handleUserInteraction)
      window.removeEventListener('touchstart', handleUserInteraction)
      window.removeEventListener('keydown', handleUserInteraction)
      clearTimeout(scrollTimeout)
      clearTimeout(inactivityTimeout)
    }
  }, [lastScrollY, isAtTop])

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isProfileOpen && !event.target.closest(`.${styles.profileWrapper}`)) {
        setIsProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isProfileOpen])

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/')
      setIsProfileOpen(false)
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const isActive = (path) => location.pathname === path

  // Add class to body when scrolled for CSS targeting
  useEffect(() => {
    if (isScrolled && !isAtTop) {
      document.body.classList.add('header-scrolled')
    } else {
      document.body.classList.remove('header-scrolled')
    }
  }, [isScrolled, isAtTop])

  return (
    <header className={`${styles.header} ${isScrolled ? styles.scrolled : ''} ${!isVisible ? styles.hidden : ''} ${isAtTop ? styles.atTop : ''}`}>
      <div className={`container ${styles.headerContainer}`}>
        <div className={styles.logoSection}>
          <Logo className={styles.logoCompact} linkTo="/login" variant="compact" />
        </div>

        <nav className={styles.navCenter}>
          <a
            href={getWebsiteUrl('/how-it-works')}
            className={styles.navLink}
          >
            How MarTechAdda Works
          </a>
          <a
            href={getWebsiteUrl('/about')}
            className={styles.navLink}
          >
            About
          </a>
          <a
            href={getWebsiteUrl('/contact')}
            className={styles.navLink}
          >
            Contact
          </a>
        </nav>

        <div className={styles.navRight}>
          {isAuthenticated ? (
            <div className={styles.profileWrapper}>
              <button
                className={styles.profileButton}
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                aria-label="Profile Menu"
              >
                <div className={styles.avatar}>
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div className={styles.userInfoWrapper}>
                  <span className={styles.userName}>{user?.name?.split(' ')[0]}</span>
                  {user?.profileStatus === 'submitted_for_verification' && (
                    <span className={`${styles.roleBadge} ${styles.badgeWarning}`}>Under Review</span>
                  )}
                </div>
                <FiChevronDown className={`${styles.chevron} ${isProfileOpen ? styles.rotate : ''}`} />
              </button>

              {isProfileOpen && (
                <div className={styles.profileDropdown}>
                  <div className={styles.dropdownHeader}>
                    <p className={styles.dropdownName}>{user?.name}</p>
                    <p className={styles.dropdownEmail}>{user?.email}</p>
                    <span className={styles.roleBadge}>{user?.role}</span>
                  </div>
                  <div className={styles.dropdownDivider}></div>

                  {user?.profileStatus === 'submitted_for_verification' ? (
                    <>
                      <Link to="/expert/status/pending" className={styles.dropdownItem} onClick={() => setIsProfileOpen(false)}>
                        <FiClock /> Application Status
                      </Link>
                      <Link to="/service-expert-register" className={styles.dropdownItem} onClick={() => setIsProfileOpen(false)}>
                        <FiFileText /> View Submitted Profile
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link to={getDashboardPath()} className={styles.dropdownItem} onClick={() => setIsProfileOpen(false)}>
                        <FiLayout /> Dashboard
                      </Link>
                    </>
                  )}

                  <div className={styles.dropdownDivider}></div>
                  <button onClick={handleLogout} className={`${styles.dropdownItem} ${styles.logoutAction}`}>
                    <FiLogOut /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className={styles.loginLink}>
              <FiLogIn className={styles.loginIcon} />
              Login
            </Link>
          )}


          <button
            className={styles.menuToggle}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Menu"
            aria-expanded={isMenuOpen}
          >
            <span className={isMenuOpen ? styles.open : ''}></span>
            <span className={isMenuOpen ? styles.open : ''}></span>
            <span className={isMenuOpen ? styles.open : ''}></span>
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className={styles.mobileMenu}>
          <a
            href={getWebsiteUrl('/how-it-works')}
            className={styles.mobileNavLink}
            onClick={() => setIsMenuOpen(false)}
          >
            How MarTechAdda Works
          </a>
          <a
            href={getWebsiteUrl('/about')}
            className={styles.mobileNavLink}
            onClick={() => setIsMenuOpen(false)}
          >
            About
          </a>
          <a
            href={getWebsiteUrl('/contact')}
            className={styles.mobileNavLink}
            onClick={() => setIsMenuOpen(false)}
          >
            Contact
          </a>
          <div className={styles.mobileCTAs}>
            {isAuthenticated ? (
              <>
                <div className={styles.mobileProfileInfo}>
                  <div className={styles.mobileAvatar}>
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <div className={styles.mobileUserData}>
                    <p className={styles.mobileUserName}>{user?.name}</p>
                    <p className={styles.mobileUserEmail}>{user?.email}</p>
                  </div>
                </div>
                <Link to={getDashboardPath()} className={styles.mobileNavLink} onClick={() => setIsMenuOpen(false)}>
                  <FiLayout /> Dashboard
                </Link>
                <button onClick={handleLogout} className={styles.mobileLogoutBtn}>
                  <FiLogOut /> Logout
                </button>
              </>
            ) : (
              <Link to="/login" className={styles.mobileLoginLink} onClick={() => setIsMenuOpen(false)}>
                <FiLogIn className={styles.mobileLoginIcon} />
                Login
              </Link>
            )}

          </div>
        </div>
      )}
    </header>
  )
}

export default Header

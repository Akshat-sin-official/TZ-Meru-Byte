import React, { useState } from 'react'
import styles from './Tabs.module.css'

const Tabs = ({ 
  tabs, 
  defaultTab = 0,
  onChange,
  className = '',
  variant = 'green' // 'green' or 'orange'
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab)

  const handleTabChange = (index) => {
    setActiveTab(index)
    if (onChange) {
      onChange(index)
    }
  }

  const tabClasses = [
    styles.tabs,
    className
  ].filter(Boolean).join(' ')

  const tabButtonClasses = (index) => {
    const classes = [styles.tab]
    if (activeTab === index) {
      // First tab (index 0) uses orange, second tab (index 1) uses green
      if (index === 0) {
        classes.push(styles.activeOrange)
      } else {
        classes.push(styles.active)
      }
    }
    return classes.filter(Boolean).join(' ')
  }

  return (
    <div className={tabClasses}>
      <div className={styles.tabListWrapper}>
        <div className={styles.tabList}>
          {tabs.map((tab, index) => (
            <button
              key={index}
              className={tabButtonClasses(index)}
              onClick={() => handleTabChange(index)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.tabContent}>
        {tabs[activeTab]?.content}
      </div>
    </div>
  )
}

export default Tabs

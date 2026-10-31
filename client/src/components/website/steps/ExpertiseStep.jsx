import React from 'react'
import { toast } from 'sonner'
import { FiCheckCircle, FiX, FiEdit2, FiInfo, FiLoader } from 'react-icons/fi'
import Card from '../ui/Card'
import Button from '../ui/Button'
import {
  SERVICE_HEADS,
  SERVICE_HEAD_TO_PRIMARY_FILTERS,
  PRIMARY_TO_SUB_FILTERS,
  INDUSTRY_SECTORS,
  INDUSTRY_SECTOR_TO_SUB_SECTORS,
  BUSINESS_RELATIONSHIP_TYPES,
  BUSINESS_TYPES,
  BUSINESS_SIZES,
  ENGAGEMENT_MODELS,
  OPERATIONAL_MODELS,
  PRICING_STYLES,
  TURNAROUND_TIMES,
  MUMBAI_REGIONS,
  LANGUAGES
} from '@/data/taxonomy'
import { calculateDayHours, TIME_OPTIONS } from '../utils/helpers'
import styles from '../ServiceExpert.module.css'

const arr = (v) => (Array.isArray(v) ? v : [])

const ExpertiseStep = ({
  formData,
  setFormData,
  handleInputChange,
  currentServiceEditIndex,
  setCurrentServiceEditIndex,
  showDashboardVerifiedSave,
  onDashboardSave,
  dashboardSaving,
  readOnly = false,
  validationErrors = {},
  enrichedSource = null
}) => {
  const [dismissEnrichedBanner, setDismissEnrichedBanner] = React.useState(false)
  const selectedPrimaryFilters = formData.serviceHead ? (SERVICE_HEAD_TO_PRIMARY_FILTERS[formData.serviceHead] || []) : []
  const availableSubFilters = Array.from(new Set(arr(formData.primaryFilters).flatMap((pff) => PRIMARY_TO_SUB_FILTERS[pff] || [])))

  // Auto pre-select all sub-sectors for any selected industry sector that doesn't have its sub-sectors selected yet
  React.useEffect(() => {
    const sectors = arr(formData.industrySectors)
    if (sectors.length === 0) return

    const currentSubs = arr(formData.industrySubSectors)
    let needsUpdate = false
    const newSubs = new Set(currentSubs)

    sectors.forEach(sec => {
      const sectorSubs = INDUSTRY_SECTOR_TO_SUB_SECTORS[sec] || []
      if (sectorSubs.length === 0) return

      const getSubKey = (s) => (s === 'Other' || s.startsWith('Other') ? `Other (${sec})` : s)
      const mappedSubs = sectorSubs.map(getSubKey)

      // If no sub-sectors belonging to this sector are selected at all, pre-select all of them
      const hasAnySelected = mappedSubs.some(s => currentSubs.includes(s) || (s.startsWith('Other') && currentSubs.includes('Other')))
      if (!hasAnySelected) {
        mappedSubs.forEach(s => newSubs.add(s))
        needsUpdate = true
      }
    })

    if (needsUpdate) {
      setFormData(prev => ({
        ...prev,
        industrySubSectors: Array.from(newSubs)
      }))
    }
  }, [formData.industrySectors])

  const handleApplyMondayToAll = () => {
    const avail = formData.workSchedule?.availability ?? {}
    const mondayConfig = avail.monday || { available: true, from: '10:00', to: '18:00' }
    
    if (!mondayConfig.available) {
      toast.error('Please configure Monday working hours first.')
      return
    }

    const newAvailability = {}
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    let total = 0
    
    days.forEach(day => {
      newAvailability[day] = { ...mondayConfig }
      total += calculateDayHours(mondayConfig.from, mondayConfig.to)
    })

    setFormData(prev => ({
      ...prev,
      workSchedule: {
        ...prev.workSchedule,
        availability: newAvailability,
        weeklyHours: parseFloat(total.toFixed(1)),
        daysOff: []
      }
    }))
    toast.success('Monday schedule applied to all days!')
  }

  return (
    <div className={styles.stepContentWrapper} style={readOnly ? { pointerEvents: 'none', opacity: 0.95 } : undefined}>
      <Card className={styles.stepCard}>
        <h2 className={styles.stepTitle}>Your Expertise</h2>
        <p className={styles.helperText} style={{ marginBottom: '24px', color: '#6B7280' }}>
          Define everything you offer once, without future rework.
        </p>

        {/* AI-Powered Service Mapping Banner */}
        {(enrichedSource || (formData.servicesDraft && formData.servicesDraft.length > 0)) && !dismissEnrichedBanner && (
          <div
            style={{
              background: 'linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%)',
              border: '1px solid #C7D2FE',
              borderRadius: '12px',
              padding: '14px 18px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '12px',
              boxShadow: '0 1px 3px rgba(79, 70, 229, 0.08)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <span style={{ fontSize: '20px', lineHeight: 1 }}>✨</span>
              <div>
                <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#312E81' }}>
                  AI-Powered Service Mapping
                </h4>
                <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#4338CA', lineHeight: 1.4 }}>
                  AI pre-selects relevant services from your website or summary. Review and edit below.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDismissEnrichedBanner(true)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#6366F1',
                padding: '4px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Dismiss"
            >
              <FiX size={16} />
            </button>
          </div>
        )}

        {/* Added Services Summary Section */}
        {formData.servicesDraft && formData.servicesDraft.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>
              Added Services ({formData.servicesDraft.length} of 4)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {formData.servicesDraft.map((service, index) => (
                <div
                  key={index}
                  className={styles.summaryCard}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    backgroundColor: '#F0F9FF',
                    borderColor: '#BAE6FD',
                    margin: 0
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FiCheckCircle style={{ color: '#0EA5E9' }} />
                      <span style={{ fontWeight: '600', color: '#0369A1' }}>{service.serviceHead}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            serviceHead: service.serviceHead,
                            primaryFilters: service.primaryFilters,
                            subFilters: service.subFilters
                          }))
                          setCurrentServiceEditIndex(index)
                        }}
                        className={styles.iconButton}
                        title="Edit Service"
                      >
                        <FiEdit2 size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const newServices = formData.servicesDraft.filter((_, i) => i !== index)
                          setFormData(prev => ({ ...prev, servicesDraft: newServices }))
                          if (currentServiceEditIndex === index) {
                            setCurrentServiceEditIndex(null)
                            setFormData(prev => ({ ...prev, serviceHead: '', primaryFilters: [], subFilters: [] }))
                          } else if (currentServiceEditIndex > index) {
                            setCurrentServiceEditIndex(prev => prev - 1)
                          }
                        }}
                        className={styles.iconButton}
                        style={{ color: '#EF4444' }}
                        title="Delete Service"
                      >
                        <FiX size={16} />
                      </button>
                    </div>
                  </div>
                  <p style={{ fontSize: '12px', color: '#64748B', marginLeft: '24px' }}>
                    {service.primaryFilters.length} Focus Areas • {service.subFilters.length} Specific Needs
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form Area - Only show if < 4 services or editing */}
        {(!formData.servicesDraft || formData.servicesDraft.length < 4 || currentServiceEditIndex !== null) ? (
          <div style={{ padding: '20px', border: '1px solid #E5E7EB', borderRadius: '12px', backgroundColor: '#FAFAFA' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
              {currentServiceEditIndex !== null ? 'Edit Service' : 'Add a Service'}
            </h3>

            {/* A. What You Do - Service Category (Single Select) */}
            <div className={styles.formGroup}>
              <label>
                Service Category (Choose one) <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>
                <FiInfo className={styles.infoIcon} style={{ marginLeft: '4px', fontSize: '14px', color: '#6B7280' }} title="Choose the main marketing services you actively provide." />
              </label>
              <div className={styles.serviceGrid}>
                {SERVICE_HEADS.map((head) => {
                  const isAlreadyAdded = formData.servicesDraft?.some((s, idx) => s.serviceHead === head && idx !== currentServiceEditIndex)
                  return (
                    <button
                      key={head}
                      type="button"
                      disabled={isAlreadyAdded}
                      onClick={() => {
                        if (formData.serviceHead === head) {
                          handleInputChange('serviceHead', '')
                          handleInputChange('primaryFilters', [])
                          handleInputChange('subFilters', [])
                        } else {
                          handleInputChange('serviceHead', head)
                          handleInputChange('primaryFilters', [])
                          handleInputChange('subFilters', [])
                        }
                      }}
                      className={`${styles.chipButton} ${formData.serviceHead === head ? styles.selected : ''}`}

                    >
                      <span style={{ display: 'block' }}>{head}</span>
                      {isAlreadyAdded && (
                        <span style={{ fontSize: '10px', color: '#6B7280', fontWeight: '400' }}>Already added</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Focus Area (Multi-select) */}
            <div className={styles.formGroup}>
              <label style={{ fontWeight: '600' }}>
                Focus Area <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>
              </label>
              {!formData.serviceHead && (
                <p className={styles.helperText} style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
                  Choose a category to continue
                </p>
              )}
              <div className={styles.filterGrid}>
                {selectedPrimaryFilters.map((pf) => (
                  <button
                    key={pf}
                    type="button"
                    onClick={() => {
                      setFormData(prev => {
                        const prevPf = arr(prev.primaryFilters)
                        const prevSf = arr(prev.subFilters)
                        const newPrimaryFilters = prevPf.includes(pf)
                          ? prevPf.filter(f => f !== pf)
                          : [...prevPf, pf]
                        const remainingSubFilters = newPrimaryFilters.flatMap(p => PRIMARY_TO_SUB_FILTERS[p] || [])
                        const filteredSubFilters = prevSf.filter(sf => remainingSubFilters.includes(sf))
                        return {
                          ...prev,
                          primaryFilters: newPrimaryFilters,
                          subFilters: filteredSubFilters
                        }
                      })
                    }}
                    className={`${styles.chipButton} ${arr(formData.primaryFilters).includes(pf) ? styles.selected : ''}`}
                  >
                    {pf}
                  </button>
                ))}
              </div>
            </div>

            {/* Specific Needs (Nested Multi-select per Focus Area with Hierarchical Select All) */}
            {arr(formData.primaryFilters).map((focusArea) => {
              const subFiltersForFocus = PRIMARY_TO_SUB_FILTERS[focusArea] || []
              if (subFiltersForFocus.length === 0) return null

              const selectedSubFilters = arr(formData.subFilters)
              const allSelected = subFiltersForFocus.every(sf => selectedSubFilters.includes(sf))

              const toggleSelectAllFocus = () => {
                setFormData(prev => {
                  const currentSubFilters = arr(prev.subFilters)
                  let updated = []
                  if (allSelected) {
                    updated = currentSubFilters.filter(sf => !subFiltersForFocus.includes(sf))
                  } else {
                    const toAdd = subFiltersForFocus.filter(sf => !currentSubFilters.includes(sf))
                    updated = [...currentSubFilters, ...toAdd]
                  }
                  return { ...prev, subFilters: updated }
                })
              }

              return (
                <div key={focusArea} className={styles.formGroup} style={{ marginTop: '12px', padding: '12px', border: '1px solid #E5E7EB', borderRadius: '8px', backgroundColor: '#FFFFFF' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                      Specific Needs for: {focusArea}
                    </span>
                    <button
                      type="button"
                      onClick={toggleSelectAllFocus}
                      style={{ fontSize: '12px', fontWeight: '600', color: '#2563EB', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      {allSelected ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {subFiltersForFocus.map((sub) => {
                      const isChecked = selectedSubFilters.includes(sub)
                      return (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => {
                            setFormData(prev => {
                              const prevSf = arr(prev.subFilters)
                              const newSubFilters = prevSf.includes(sub)
                                ? prevSf.filter((s) => s !== sub)
                                : [...prevSf, sub]
                              return { ...prev, subFilters: newSubFilters }
                            })
                          }}
                          className={`${styles.chipButton} ${isChecked ? styles.selected : ''}`}
                        >
                          {sub}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            <div style={{ marginTop: '24px' }}>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  if (!formData.serviceHead || arr(formData.primaryFilters).length === 0) {
                    toast.error('Please select a service category and at least one focus area.')
                    return
                  }
                  if (arr(formData.subFilters).length === 0) {
                    toast.error('Please select at least one specific need (sub-filter) for your service.')
                    return
                  }

                  const serviceData = {
                    serviceHead: formData.serviceHead,
                    primaryFilters: arr(formData.primaryFilters),
                    subFilters: arr(formData.subFilters),
                  }

                  setFormData(prev => {
                    const newDraft = [...(prev.servicesDraft || [])]
                    if (currentServiceEditIndex !== null) {
                      newDraft[currentServiceEditIndex] = serviceData
                    } else {
                      if (newDraft.length >= 4) {
                        toast.error('Maximum 4 services allowed.')
                        return prev
                      }
                      newDraft.push(serviceData)
                    }
                    return {
                      ...prev,
                      servicesDraft: newDraft,
                      serviceHead: '',
                      primaryFilters: [],
                      subFilters: []
                    }
                  })
                  setCurrentServiceEditIndex(null)
                  toast.success(currentServiceEditIndex !== null ? 'Service updated!' : 'Service added!')
                }}
              >
                {currentServiceEditIndex !== null ? 'Update Service' : (formData.servicesDraft?.length > 0 ? 'Add Another Service' : 'Add Service')}
              </Button>
              {currentServiceEditIndex !== null && (
                <Button
                  variant="outline"
                  size="sm"
                  style={{ marginLeft: '12px' }}
                  onClick={() => {
                    setCurrentServiceEditIndex(null)
                    handleInputChange('serviceHead', '')
                    handleInputChange('primaryFilters', [])
                    handleInputChange('subFilters', [])
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div style={{ padding: '24px', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '12px', textAlign: 'center' }}>
            <p style={{ color: '#166534', fontWeight: '600', fontSize: '16px' }}>
              ✅ You've added all core service categories.
            </p>
            <p style={{ color: '#15803D', marginTop: '8px' }}>
              You can edit or remove existing services above, or proceed to the next step.
            </p>
          </div>
        )}

        <div style={{ borderTop: '2px solid #E5E7EB', marginTop: '32px', paddingTop: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>B. Who You Serve (Market Fit)</h3>
          <p className={styles.helperText} style={{ marginBottom: '16px', fontSize: '13px', color: '#6B7280' }}>
            The following details apply across all selected services.
          </p>

          {/* Industry Sector (Multi-Select) */}
          <div className={styles.formGroup}>
            <label style={{ fontWeight: '600' }}>
              Industry Sector <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>
            </label>
            <div className={styles.sectorGrid}>
              {INDUSTRY_SECTORS.map((sector) => {
                const selectedSectors = arr(formData.industrySectors)
                const isSelected = selectedSectors.includes(sector)

                return (
                  <button
                    key={sector}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        // Deselect sector: remove sector and remove only sub-sectors belonging to this sector
                        const updatedSectors = selectedSectors.filter(s => s !== sector)
                        const sectorSubSectors = INDUSTRY_SECTOR_TO_SUB_SECTORS[sector] || []
                        const getSubKey = (s) => (s === 'Other' || s.startsWith('Other') ? `Other (${sector})` : s)
                        const currentMappedKeys = sectorSubSectors.map(getSubKey)
                        const updatedSubSectors = arr(formData.industrySubSectors).filter(
                          s => !currentMappedKeys.includes(s) && !sectorSubSectors.includes(s) && s !== `Other (${sector})` && s !== 'Other'
                        )
                        setFormData(prev => ({
                          ...prev,
                          industrySectors: updatedSectors,
                          industrySector: updatedSectors[0] || '',
                          industrySubSectors: updatedSubSectors
                        }))
                      } else {
                        // Select sector: auto-select all its sub-sectors by default
                        const updatedSectors = [...selectedSectors, sector]
                        const sectorSubSectors = INDUSTRY_SECTOR_TO_SUB_SECTORS[sector] || []
                        const getSubKey = (s) => (s === 'Other' || s.startsWith('Other') ? `Other (${sector})` : s)
                        const mappedSubSectors = sectorSubSectors.map(getSubKey)
                        const currentSubs = arr(formData.industrySubSectors)
                        const mergedSubs = Array.from(new Set([...currentSubs, ...mappedSubSectors]))
                        setFormData(prev => ({
                          ...prev,
                          industrySectors: updatedSectors,
                          industrySector: updatedSectors[0] || sector,
                          industrySubSectors: mergedSubs
                        }))
                      }
                    }}
                    className={`${styles.chipButton} ${isSelected ? styles.selected : ''}`}
                  >
                    {sector}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Industry Sub-Sectors (Grouped Multi-Select per Selected Industry Sector with Select All) */}
          {arr(formData.industrySectors).length > 0 && arr(formData.industrySectors).map((sec) => {
            const currentSubSectors = INDUSTRY_SECTOR_TO_SUB_SECTORS[sec] || []
            if (currentSubSectors.length === 0) return null

            const selectedSubSectors = arr(formData.industrySubSectors)
            const getSubKey = (s) => (s === 'Other' || s.startsWith('Other') ? `Other (${sec})` : s)
            const allSubSelected = currentSubSectors.every(s => {
              const k = getSubKey(s)
              return selectedSubSectors.includes(k)
            })

            const toggleSelectAllSubSectors = () => {
              const currentMappedKeys = currentSubSectors.map(getSubKey)
              if (allSubSelected) {
                // Deselect all sub-sectors for this sector only
                const updated = selectedSubSectors.filter(s => !currentMappedKeys.includes(s) && !currentSubSectors.includes(s) && s !== `Other (${sec})` && s !== 'Other')
                handleInputChange('industrySubSectors', updated)
              } else {
                // Select all sub-sectors for this sector
                const newSubs = currentMappedKeys.filter(s => !selectedSubSectors.includes(s))
                handleInputChange('industrySubSectors', [...selectedSubSectors.filter(s => s !== 'Other'), ...newSubs])
              }
            }

            const handleRemoveSector = () => {
              const updatedSectors = arr(formData.industrySectors).filter(s => s !== sec)
              const currentMappedKeys = currentSubSectors.map(getSubKey)
              const updatedSubSectors = arr(formData.industrySubSectors).filter(
                s => !currentMappedKeys.includes(s) && !currentSubSectors.includes(s) && s !== `Other (${sec})` && s !== 'Other'
              )
              setFormData(prev => ({
                ...prev,
                industrySectors: updatedSectors,
                industrySector: prev.industrySector === sec ? (updatedSectors[0] || '') : prev.industrySector,
                industrySubSectors: updatedSubSectors
              }))
            }

            return (
              <div key={sec} className={styles.formGroup} style={{ marginTop: '16px', padding: '12px', border: '1px solid #E5E7EB', borderRadius: '8px', backgroundColor: '#FFFFFF' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                      Sub-Sectors for: {sec}
                    </span>
                    <button
                      type="button"
                      onClick={handleRemoveSector}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        fontWeight: '500',
                        color: '#DC2626',
                        backgroundColor: '#FEF2F2',
                        border: '1px solid #FECACA',
                        borderRadius: '4px',
                        padding: '2px 8px',
                        cursor: 'pointer'
                      }}
                      title={`Remove ${sec} and its sub-sectors`}
                    >
                      <FiX size={12} /> Remove
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={toggleSelectAllSubSectors}
                    style={{ fontSize: '12px', fontWeight: '600', color: '#2563EB', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    {allSubSelected ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {currentSubSectors.map((subSector) => {
                    const subKey = getSubKey(subSector)
                    const isChecked = selectedSubSectors.includes(subKey)
                    return (
                      <button
                        key={subSector}
                        type="button"
                        onClick={() => {
                          const updated = isChecked
                            ? selectedSubSectors.filter(s => s !== subKey && s !== 'Other')
                            : [...selectedSubSectors.filter(s => s !== 'Other'), subKey]
                          handleInputChange('industrySubSectors', updated)
                        }}
                        className={`${styles.chipButton} ${isChecked ? styles.selected : ''}`}
                      >
                        {subSector}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Service Delivery Coverage (Service Area) */}
          <div className={styles.formGroup}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ margin: 0 }}>
                Service Area
                <FiInfo className={styles.infoIcon} style={{ marginLeft: '4px', fontSize: '14px', color: '#6B7280' }} title="Used for discovery and quotation clarity only." />
              </label>
              <button
                type="button"
                onClick={() => {
                  const currentRegs = arr(formData.serviceDeliveryStates);
                  const isAllSelected = MUMBAI_REGIONS.length > 0 && MUMBAI_REGIONS.every(r => currentRegs.includes(r));
                  setFormData(prev => ({
                    ...prev,
                    serviceDeliveryStates: isAllSelected ? [] : [...MUMBAI_REGIONS],
                    panIndiaAvailable: false
                  }));
                }}
                style={{ fontSize: '12px', fontWeight: '600', color: '#2563EB', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {MUMBAI_REGIONS.length > 0 && MUMBAI_REGIONS.every(r => arr(formData.serviceDeliveryStates).includes(r)) ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <p className={styles.helperText} style={{ marginBottom: '8px', fontSize: '13px', color: '#6B7280' }}>
              Where can you deliver your services? (Select all that apply)
            </p>
            <p className={styles.helperText} style={{ marginBottom: '12px', fontSize: '12px', color: '#6B7280', fontStyle: 'italic' }}>
              Used only for accurate matching — not for promotions.
            </p>

            <div className={styles.regionGrid}>
              {MUMBAI_REGIONS.map((region) => (
                <button
                  key={region}
                  type="button"
                  onClick={() => {
                    setFormData(prev => {
                      const prevRegs = arr(prev.serviceDeliveryStates)
                      const newRegions = prevRegs.includes(region)
                        ? prevRegs.filter(s => s !== region)
                        : [...prevRegs, region]
                      return { ...prev, serviceDeliveryStates: newRegions, panIndiaAvailable: false }
                    })
                  }}
                  className={`${styles.chipButton} ${arr(formData.serviceDeliveryStates).includes(region) ? styles.selected : ''}`}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${arr(formData.serviceDeliveryStates).includes(region) ? 'var(--color-primary, #3b82f6)' : 'var(--color-border, #e5e7eb)'}`,
                    backgroundColor: arr(formData.serviceDeliveryStates).includes(region) ? 'var(--color-primary-light, rgba(59, 130, 246, 0.1))' : 'transparent',
                    fontSize: '13px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <div style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '4px',
                    border: `1px solid ${arr(formData.serviceDeliveryStates).includes(region) ? 'var(--color-primary, #3b82f6)' : '#D1D5DB'}`,
                    backgroundColor: arr(formData.serviceDeliveryStates).includes(region) ? 'var(--color-primary, #3b82f6)' : 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {arr(formData.serviceDeliveryStates).includes(region) && <FiCheckCircle style={{ color: 'white', fontSize: '10px' }} />}
                  </div>
                  {region}
                </button>
              ))}
            </div>
          </div>

          {/* Client Engagement Types */}
          <div className={styles.formGroup}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ margin: 0 }}>
                Client Engagement Types
                <FiInfo className={styles.infoIcon} style={{ marginLeft: '4px', fontSize: '14px', color: '#6B7280' }} title="Select the business models your clients typically operate under. This ensures compatibility with buyer workflows." />
              </label>
              <button
                type="button"
                onClick={() => {
                  const currentVals = arr(formData.businessRelationshipTypes);
                  const isAllSelected = BUSINESS_RELATIONSHIP_TYPES.length > 0 && BUSINESS_RELATIONSHIP_TYPES.every(t => currentVals.includes(t));
                  setFormData(prev => ({
                    ...prev,
                    businessRelationshipTypes: isAllSelected ? [] : [...BUSINESS_RELATIONSHIP_TYPES]
                  }));
                }}
                style={{ fontSize: '12px', fontWeight: '600', color: '#2563EB', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {BUSINESS_RELATIONSHIP_TYPES.length > 0 && BUSINESS_RELATIONSHIP_TYPES.every(t => arr(formData.businessRelationshipTypes).includes(t)) ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
              {BUSINESS_RELATIONSHIP_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setFormData(prev => {
                      const prevVals = arr(prev.businessRelationshipTypes)
                      const newTypes = prevVals.includes(type)
                        ? prevVals.filter(t => t !== type)
                        : [...prevVals, type]
                      return { ...prev, businessRelationshipTypes: newTypes }
                    })
                  }}
                  className={`${styles.chipButton} ${arr(formData.businessRelationshipTypes).includes(type) ? styles.selected : ''}`}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${arr(formData.businessRelationshipTypes).includes(type) ? 'var(--color-primary, #3b82f6)' : 'var(--color-border, #e5e7eb)'}`,
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Business Types */}
          <div className={styles.formGroup}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ margin: 0 }}>
                Business Types Served
                <FiInfo className={styles.infoIcon} style={{ marginLeft: '4px', fontSize: '14px', color: '#6B7280' }} title="Choose the operational structure of the clients you commonly support (e.g., Manufacturer, Distributor)." />
              </label>
              <button
                type="button"
                onClick={() => {
                  const currentVals = arr(formData.businessTypes);
                  const isAllSelected = BUSINESS_TYPES.length > 0 && BUSINESS_TYPES.every(t => currentVals.includes(t));
                  setFormData(prev => ({
                    ...prev,
                    businessTypes: isAllSelected ? [] : [...BUSINESS_TYPES]
                  }));
                }}
                style={{ fontSize: '12px', fontWeight: '600', color: '#2563EB', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {BUSINESS_TYPES.length > 0 && BUSINESS_TYPES.every(t => arr(formData.businessTypes).includes(t)) ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
              {BUSINESS_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setFormData(prev => {
                      const prevBt = arr(prev.businessTypes)
                      const newTypes = prevBt.includes(type)
                        ? prevBt.filter(t => t !== type)
                        : [...prevBt, type]
                      return { ...prev, businessTypes: newTypes }
                    })
                  }}
                  className={`${styles.chipButton} ${arr(formData.businessTypes).includes(type) ? styles.selected : ''}`}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${arr(formData.businessTypes).includes(type) ? 'var(--color-primary, #3b82f6)' : 'var(--color-border, #e5e7eb)'}`,
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Client Scale */}
          <div className={styles.formGroup}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ margin: 0 }}>
                Client Scales Served
                <FiInfo className={styles.infoIcon} style={{ marginLeft: '4px', fontSize: '14px', color: '#6B7280' }} title="Choose the typical size of clients you work with (e.g., Startups, SMBs, Enterprises)." />
              </label>
              <button
                type="button"
                onClick={() => {
                  const currentVals = arr(formData.businessSizes);
                  const isAllSelected = BUSINESS_SIZES.length > 0 && BUSINESS_SIZES.every(s => currentVals.includes(s));
                  setFormData(prev => ({
                    ...prev,
                    businessSizes: isAllSelected ? [] : [...BUSINESS_SIZES]
                  }));
                }}
                style={{ fontSize: '12px', fontWeight: '600', color: '#2563EB', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {BUSINESS_SIZES.length > 0 && BUSINESS_SIZES.every(s => arr(formData.businessSizes).includes(s)) ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
              {BUSINESS_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => {
                    setFormData(prev => {
                      const prevBs = arr(prev.businessSizes)
                      const newSizes = prevBs.includes(size)
                        ? prevBs.filter(s => s !== size)
                        : [...prevBs, size]
                      return { ...prev, businessSizes: newSizes }
                    })
                  }}
                  className={`${styles.chipButton} ${arr(formData.businessSizes).includes(size) ? styles.selected : ''}`}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${arr(formData.businessSizes).includes(size) ? 'var(--color-primary, #3b82f6)' : 'var(--color-border, #e5e7eb)'}`,
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ borderTop: '2px solid #E5E7EB', marginTop: '32px', paddingTop: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>C. How You Work (Commercial & Delivery Fit)</h3>

          {/* Engagement Models */}
          <div className={styles.formGroup}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ margin: 0 }}>
                How would you prefer to engage?
                <FiInfo className={styles.infoIcon} style={{ marginLeft: '4px', fontSize: '14px', color: '#6B7280' }} title="Select how you typically work with clients" />
              </label>
              <button
                type="button"
                onClick={() => {
                  const currentVals = arr(formData.engagementModels);
                  const isAllSelected = ENGAGEMENT_MODELS.length > 0 && ENGAGEMENT_MODELS.every(m => currentVals.includes(m));
                  setFormData(prev => ({
                    ...prev,
                    engagementModels: isAllSelected ? [] : [...ENGAGEMENT_MODELS]
                  }));
                }}
                style={{ fontSize: '12px', fontWeight: '600', color: '#2563EB', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {ENGAGEMENT_MODELS.length > 0 && ENGAGEMENT_MODELS.every(m => arr(formData.engagementModels).includes(m)) ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
              {ENGAGEMENT_MODELS.map((model) => (
                <button
                  key={model}
                  type="button"
                  onClick={() => {
                    setFormData(prev => {
                      const prevEm = arr(prev.engagementModels)
                      const newModels = prevEm.includes(model)
                        ? prevEm.filter(m => m !== model)
                        : [...prevEm, model]
                      return { ...prev, engagementModels: newModels }
                    })
                  }}
                  className={`${styles.chipButton} ${arr(formData.engagementModels).includes(model) ? styles.selected : ''}`}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${arr(formData.engagementModels).includes(model) ? 'var(--color-primary, #3b82f6)' : 'var(--color-border, #e5e7eb)'}`,
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {model}
                </button>
              ))}
            </div>
          </div>

          {/* Delivery Channels */}
          <div className={styles.formGroup}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ margin: 0 }}>
                Delivery Channels You Support
                <FiInfo className={styles.infoIcon} style={{ marginLeft: '4px', fontSize: '14px', color: '#6B7280' }} title="Select how you deliver your services depending on client needs." />
              </label>
              <button
                type="button"
                onClick={() => {
                  const currentVals = arr(formData.deliveryChannels);
                  const isAllSelected = OPERATIONAL_MODELS.length > 0 && OPERATIONAL_MODELS.every(c => currentVals.includes(c));
                  setFormData(prev => ({
                    ...prev,
                    deliveryChannels: isAllSelected ? [] : [...OPERATIONAL_MODELS]
                  }));
                }}
                style={{ fontSize: '12px', fontWeight: '600', color: '#2563EB', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {OPERATIONAL_MODELS.length > 0 && OPERATIONAL_MODELS.every(c => arr(formData.deliveryChannels).includes(c)) ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
              {OPERATIONAL_MODELS.map((channel) => (
                <button
                  key={channel}
                  type="button"
                  onClick={() => {
                    setFormData(prev => {
                      const prevDc = arr(prev.deliveryChannels)
                      const newChannels = prevDc.includes(channel)
                        ? prevDc.filter(c => c !== channel)
                        : [...prevDc, channel]
                      return { ...prev, deliveryChannels: newChannels }
                    })
                  }}
                  className={`${styles.chipButton} ${arr(formData.deliveryChannels).includes(channel) ? styles.selected : ''}`}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${arr(formData.deliveryChannels).includes(channel) ? 'var(--color-primary, #3b82f6)' : 'var(--color-border, #e5e7eb)'}`,
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {channel}
                </button>
              ))}
            </div>
          </div>

          {/* Pricing Models */}
          <div className={styles.formGroup}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ margin: 0 }}>
                Your Pricing Structure
                <FiInfo className={styles.infoIcon} style={{ marginLeft: '4px', fontSize: '14px', color: '#6B7280' }} title="Select the pricing models you support. This improves transparency and reduces unqualified leads." />
              </label>
              <button
                type="button"
                onClick={() => {
                  const currentVals = arr(formData.pricingModels);
                  const isAllSelected = PRICING_STYLES.length > 0 && PRICING_STYLES.every(m => currentVals.includes(m));
                  setFormData(prev => ({
                    ...prev,
                    pricingModels: isAllSelected ? [] : [...PRICING_STYLES]
                  }));
                }}
                style={{ fontSize: '12px', fontWeight: '600', color: '#2563EB', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {PRICING_STYLES.length > 0 && PRICING_STYLES.every(m => arr(formData.pricingModels).includes(m)) ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
              {PRICING_STYLES.map((model) => (
                <button
                  key={model}
                  type="button"
                  onClick={() => {
                    setFormData(prev => {
                      const prevPm = arr(prev.pricingModels)
                      const newModels = prevPm.includes(model)
                        ? prevPm.filter(m => m !== model)
                        : [...prevPm, model]
                      return { ...prev, pricingModels: newModels }
                    })
                  }}
                  className={`${styles.chipButton} ${arr(formData.pricingModels).includes(model) ? styles.selected : ''}`}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${arr(formData.pricingModels).includes(model) ? 'var(--color-primary, #3b82f6)' : 'var(--color-border, #e5e7eb)'}`,
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {model}
                </button>
              ))}
            </div>
          </div>

          {/* Delivery Speed */}
          <div className={styles.formGroup}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ margin: 0 }}>
                Preferred Turnaround
                <FiInfo className={styles.infoIcon} style={{ marginLeft: '4px', fontSize: '14px', color: '#6B7280' }} title="Select your typical delivery speeds. Actual timelines may vary by service type." />
              </label>
              <button
                type="button"
                onClick={() => {
                  const currentVals = arr(formData.deliverySpeed);
                  const isAllSelected = TURNAROUND_TIMES.length > 0 && TURNAROUND_TIMES.every(s => currentVals.includes(s));
                  setFormData(prev => ({
                    ...prev,
                    deliverySpeed: isAllSelected ? [] : [...TURNAROUND_TIMES]
                  }));
                }}
                style={{ fontSize: '12px', fontWeight: '600', color: '#2563EB', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {TURNAROUND_TIMES.length > 0 && TURNAROUND_TIMES.every(s => arr(formData.deliverySpeed).includes(s)) ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
              {TURNAROUND_TIMES.map((speed) => (
                <button
                  key={speed}
                  type="button"
                  onClick={() => {
                    setFormData(prev => {
                      const prevSp = arr(prev.deliverySpeed)
                      const newSpeeds = prevSp.includes(speed)
                        ? prevSp.filter(s => s !== speed)
                        : [...prevSp, speed]
                      return { ...prev, deliverySpeed: newSpeeds }
                    })
                  }}
                  className={`${styles.chipButton} ${arr(formData.deliverySpeed).includes(speed) ? styles.selected : ''}`}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${arr(formData.deliverySpeed).includes(speed) ? 'var(--color-primary, #3b82f6)' : 'var(--color-border, #e5e7eb)'}`,
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {speed}
                </button>
              ))}
            </div>
          </div>
          {/* Minimum Engagement Rate / Value */}
          <div className={styles.formGroup} style={{ marginTop: '24px' }}>
            <label style={{ fontSize: '14px', fontWeight: '600', color: '#1F2937', marginBottom: '4px', display: 'block' }}>
              Minimum Engagement Rate / Value <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '12px' }}>
              Set the minimum amount you charge for an engagement.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px' }}>
              {/* Numeric Input with ₹ prefix */}
              <div style={{ position: 'relative', width: '220px' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontWeight: '700', color: '#374151', fontSize: '15px' }}>₹</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={formData.minEngagementValue !== undefined && formData.minEngagementValue !== null && formData.minEngagementValue !== '' ? Number(formData.minEngagementValue).toLocaleString('en-IN') : ''}
                  onChange={(e) => {
                    const rawVal = e.target.value.replace(/[^0-9]/g, '');
                    const numVal = rawVal ? parseInt(rawVal, 10) : '';
                    handleInputChange('minEngagementValue', numVal);
                  }}
                  placeholder="25,000"
                  style={{ width: '100%', paddingLeft: '34px', paddingRight: '12px', paddingTop: '10px', paddingBottom: '10px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '15px', fontWeight: '600', color: '#111827', outline: 'none' }}
                />
              </div>

              {/* Rate Unit Pill Buttons: [ Per Project ] [ Per Hour ] */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {['Per Project', 'Per Hour'].map((unitOption) => {
                  const isSelected = (formData.minEngagementUnit || 'Per Project') === unitOption;
                  return (
                    <button
                      key={unitOption}
                      type="button"
                      onClick={() => handleInputChange('minEngagementUnit', unitOption)}
                      style={{
                        padding: '9px 16px',
                        borderRadius: '8px',
                        border: `1.5px solid ${isSelected ? '#2563EB' : '#D1D5DB'}`,
                        backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF',
                        color: isSelected ? '#1E40AF' : '#4B5563',
                        fontSize: '13.5px',
                        fontWeight: isSelected ? '700' : '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s ease',
                        boxShadow: isSelected ? '0 1px 2px rgba(37, 99, 235, 0.1)' : 'none'
                      }}
                    >
                      <div style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        border: `2px solid ${isSelected ? '#2563EB' : '#9CA3AF'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {isSelected && (
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#2563EB' }} />
                        )}
                      </div>
                      <span>{unitOption}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '2px solid #E5E7EB', marginTop: '32px', paddingTop: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>D. Communication & Availability</h3>

          {/* Languages */}
          <div className={styles.formGroup}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ margin: 0 }}>
                Languages You Support
                <FiInfo className={styles.infoIcon} style={{ marginLeft: '4px', fontSize: '14px', color: '#6B7280' }} title="Choose the languages you can communicate and deliver work in." />
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleInputChange('languages', [...LANGUAGES])}
                  style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', border: '1px solid #3B82F6', color: '#2563EB', backgroundColor: '#EFF6FF', cursor: 'pointer', fontWeight: '600' }}
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange('languages', [])}
                  style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', border: '1px solid #D1D5DB', color: '#4B5563', backgroundColor: '#F3F4F6', cursor: 'pointer', fontWeight: '600' }}
                >
                  Clear All
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => {
                    setFormData(prev => {
                      const prevLang = arr(prev.languages)
                      const newLangs = prevLang.includes(lang)
                        ? prevLang.filter(l => l !== lang)
                        : [...prevLang, lang]
                      return { ...prev, languages: newLangs }
                    })
                  }}
                  className={`${styles.chipButton} ${arr(formData.languages).includes(lang) ? styles.selected : ''}`}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${arr(formData.languages).includes(lang) ? 'var(--color-primary, #3b82f6)' : 'var(--color-border, #e5e7eb)'}`,
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          {/* Work Schedule & Availability */}
          <div className={styles.formGroup}>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>
                Work Schedule & Availability <span style={{ color: '#EF4444', fontWeight: 'bold' }}>*</span>
              </span>
              <div style={{ padding: '4px 12px', backgroundColor: '#F0F9FF', borderRadius: '20px', border: '1px solid #BAE6FD' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#0369A1' }}>
                  Total Weekly Capacity: {formData.workSchedule?.weeklyHours || 0} Hours
                </span>
              </div>
            </label>
            {validationErrors?.workSchedule && (
              <div style={{
                color: '#DC2626',
                backgroundColor: '#FEF2F2',
                border: '1px solid #FCA5A5',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
                marginBottom: '12px'
              }}>
                {validationErrors.workSchedule}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <p className={styles.helperText} style={{ margin: 0, fontSize: '13px', color: '#6B7280' }}>
                Define your typical working hours per day.
              </p>
              <button
                type="button"
                onClick={handleApplyMondayToAll}
                style={{ 
                  fontSize: '13px', 
                  color: '#3b82f6', 
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#eff6ff',
                  border: '1px solid #dbeafe',
                  cursor: 'pointer',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  transition: 'all 0.2s ease'
                }}
              >
                <FiCheckCircle size={14} /> Apply Monday to All Days
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px', backgroundColor: 'white' }}>
              {Object.entries({
                monday: 'Monday',
                tuesday: 'Tuesday',
                wednesday: 'Wednesday',
                thursday: 'Thursday',
                friday: 'Friday',
                saturday: 'Saturday',
                sunday: 'Sunday'
              }).map(([dayKey, dayName]) => {
                const avail = formData.workSchedule?.availability ?? {}
                const config = avail[dayKey] || { available: false, from: '10:00', to: '18:00' }
                const dayHours = config.available ? calculateDayHours(config.from, config.to) : 0
                const hasError = config.available && dayHours < 0.5

                return (
                  <div key={dayKey} style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 16px',
                    backgroundColor: config.available ? '#FFFFFF' : '#F9FAFB',
                    border: `1px solid ${hasError ? '#FECACA' : (config.available ? '#E5E7EB' : '#F3F4F6')}`,
                    borderRadius: '8px',
                    transition: 'all 0.2s ease',
                    opacity: config.available ? 1 : 0.7
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', width: '140px', gap: '10px' }}>
                      <input
                        type="checkbox"
                        checked={config.available}
                        onChange={(e) => {
                          const isAvailable = e.target.checked
                          const baseAvail = formData.workSchedule?.availability ?? {}
                          const newAvailability = { ...baseAvail }
                          newAvailability[dayKey] = { ...config, available: isAvailable }

                          // Recalculate totals
                          let total = 0
                          const newDaysOff = []
                          Object.entries(newAvailability).forEach(([dk, cfg]) => {
                            if (cfg.available) {
                              total += calculateDayHours(cfg.from, cfg.to)
                            } else {
                              const name = dayKey === dk ? dayName : { monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday' }[dk]
                              newDaysOff.push(name)
                            }
                          })

                          setFormData(prev => ({
                            ...prev,
                            workSchedule: {
                              ...prev.workSchedule,
                              availability: newAvailability,
                              weeklyHours: parseFloat(total.toFixed(1)),
                              daysOff: newDaysOff
                            }
                          }))
                        }}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <span style={{ fontWeight: config.available ? '600' : '400', fontSize: '14px', color: config.available ? '#1F2937' : '#6B7280' }}>
                        {dayName}
                      </span>
                    </div>

                    {config.available ? (
                      <div className={styles.flexResponsive} style={{ flex: 1, justifyContent: 'space-between' }}>
                        <div className={styles.flexResponsive} style={{ gap: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '12px', fontWeight: '600', color: '#6B7280' }}>From</span>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              {/* Hour Dropdown (1-12) */}
                              <select
                                value={(() => {
                                  const [h24Str] = (config.from || '09:00').split(':');
                                  const h24 = parseInt(h24Str || '9', 10);
                                  return (h24 % 12 || 12).toString();
                                })()}
                                onChange={(e) => {
                                  const newH12 = e.target.value;
                                  const [, mStr] = (config.from || '09:00').split(':');
                                  const h24 = parseInt((config.from || '09:00').split(':')[0] || '9', 10);
                                  const ampm = h24 >= 12 ? 'PM' : 'AM';
                                  let h = parseInt(newH12, 10);
                                  if (ampm === 'PM' && h < 12) h += 12;
                                  if (ampm === 'AM' && h === 12) h = 0;
                                  const from = `${h.toString().padStart(2, '0')}:${mStr || '00'}`;
                                  
                                  const baseAvail = formData.workSchedule?.availability ?? {};
                                  const newAvailability = { ...baseAvail };
                                  newAvailability[dayKey] = { ...config, from };
                                  let total = 0;
                                  Object.values(newAvailability).forEach(cfg => {
                                    if (cfg.available) total += calculateDayHours(cfg.from, cfg.to);
                                  });
                                  setFormData(prev => ({
                                    ...prev,
                                    workSchedule: { ...prev.workSchedule, availability: newAvailability, weeklyHours: parseFloat(total.toFixed(1)) }
                                  }));
                                }}
                                style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '13px', fontWeight: '500', backgroundColor: 'white' }}
                              >
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(h => <option key={h} value={h.toString()}>{h}</option>)}
                              </select>
                              <span style={{ fontSize: '13px', fontWeight: '700', color: '#6B7280' }}>:</span>
                              {/* Minute Dropdown (00, 15, 30, 45) */}
                              <select
                                value={(() => {
                                  const [, mStr] = (config.from || '09:00').split(':');
                                  return ['00', '15', '30', '45'].includes(mStr) ? mStr : (parseInt(mStr || '0', 10) >= 30 ? '30' : '00');
                                })()}
                                onChange={(e) => {
                                  const newMin = e.target.value;
                                  const [h24Str] = (config.from || '09:00').split(':');
                                  const from = `${h24Str || '09'}:${newMin}`;
                                  
                                  const baseAvail = formData.workSchedule?.availability ?? {};
                                  const newAvailability = { ...baseAvail };
                                  newAvailability[dayKey] = { ...config, from };
                                  let total = 0;
                                  Object.values(newAvailability).forEach(cfg => {
                                    if (cfg.available) total += calculateDayHours(cfg.from, cfg.to);
                                  });
                                  setFormData(prev => ({
                                    ...prev,
                                    workSchedule: { ...prev.workSchedule, availability: newAvailability, weeklyHours: parseFloat(total.toFixed(1)) }
                                  }));
                                }}
                                style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '13px', fontWeight: '500', backgroundColor: 'white' }}
                              >
                                {['00', '15', '30', '45'].map(m => <option key={m} value={m}>{m}</option>)}
                              </select>
                              {/* AM/PM Dropdown */}
                              <select
                                value={(() => {
                                  const [h24Str] = (config.from || '09:00').split(':');
                                  const h24 = parseInt(h24Str || '9', 10);
                                  return h24 >= 12 ? 'PM' : 'AM';
                                })()}
                                onChange={(e) => {
                                  const newAmPm = e.target.value;
                                  const [h24Str, mStr] = (config.from || '09:00').split(':');
                                  let h = parseInt(h24Str || '9', 10) % 12 || 12;
                                  if (newAmPm === 'PM' && h < 12) h += 12;
                                  if (newAmPm === 'AM' && h === 12) h = 0;
                                  const from = `${h.toString().padStart(2, '0')}:${mStr || '00'}`;
                                  
                                  const baseAvail = formData.workSchedule?.availability ?? {};
                                  const newAvailability = { ...baseAvail };
                                  newAvailability[dayKey] = { ...config, from };
                                  let total = 0;
                                  Object.values(newAvailability).forEach(cfg => {
                                    if (cfg.available) total += calculateDayHours(cfg.from, cfg.to);
                                  });
                                  setFormData(prev => ({
                                    ...prev,
                                    workSchedule: { ...prev.workSchedule, availability: newAvailability, weeklyHours: parseFloat(total.toFixed(1)) }
                                  }));
                                }}
                                style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '13px', fontWeight: '700', backgroundColor: '#F9FAFB' }}
                              >
                                <option value="AM">AM</option>
                                <option value="PM">PM</option>
                              </select>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '12px', fontWeight: '600', color: '#6B7280' }}>To</span>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              {/* Hour Dropdown (1-12) */}
                              <select
                                value={(() => {
                                  const [h24Str] = (config.to || '18:00').split(':');
                                  const h24 = parseInt(h24Str || '18', 10);
                                  return (h24 % 12 || 12).toString();
                                })()}
                                onChange={(e) => {
                                  const newH12 = e.target.value;
                                  const [, mStr] = (config.to || '18:00').split(':');
                                  const h24 = parseInt((config.to || '18:00').split(':')[0] || '18', 10);
                                  const ampm = h24 >= 12 ? 'PM' : 'AM';
                                  let h = parseInt(newH12, 10);
                                  if (ampm === 'PM' && h < 12) h += 12;
                                  if (ampm === 'AM' && h === 12) h = 0;
                                  const to = `${h.toString().padStart(2, '0')}:${mStr || '00'}`;
                                  
                                  const baseAvail = formData.workSchedule?.availability ?? {};
                                  const newAvailability = { ...baseAvail };
                                  newAvailability[dayKey] = { ...config, to };
                                  let total = 0;
                                  Object.values(newAvailability).forEach(cfg => {
                                    if (cfg.available) total += calculateDayHours(cfg.from, cfg.to);
                                  });
                                  setFormData(prev => ({
                                    ...prev,
                                    workSchedule: { ...prev.workSchedule, availability: newAvailability, weeklyHours: parseFloat(total.toFixed(1)) }
                                  }));
                                }}
                                style={{ padding: '6px 8px', borderRadius: '6px', border: `1px solid ${hasError ? '#EF4444' : '#D1D5DB'}`, fontSize: '13px', fontWeight: '500', backgroundColor: 'white' }}
                              >
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(h => <option key={h} value={h.toString()}>{h}</option>)}
                              </select>
                              <span style={{ fontSize: '13px', fontWeight: '700', color: '#6B7280' }}>:</span>
                              {/* Minute Dropdown (00, 15, 30, 45) */}
                              <select
                                value={(() => {
                                  const [, mStr] = (config.to || '18:00').split(':');
                                  return ['00', '15', '30', '45'].includes(mStr) ? mStr : (parseInt(mStr || '0', 10) >= 30 ? '30' : '00');
                                })()}
                                onChange={(e) => {
                                  const newMin = e.target.value;
                                  const [h24Str] = (config.to || '18:00').split(':');
                                  const to = `${h24Str || '18'}:${newMin}`;
                                  
                                  const baseAvail = formData.workSchedule?.availability ?? {};
                                  const newAvailability = { ...baseAvail };
                                  newAvailability[dayKey] = { ...config, to };
                                  let total = 0;
                                  Object.values(newAvailability).forEach(cfg => {
                                    if (cfg.available) total += calculateDayHours(cfg.from, cfg.to);
                                  });
                                  setFormData(prev => ({
                                    ...prev,
                                    workSchedule: { ...prev.workSchedule, availability: newAvailability, weeklyHours: parseFloat(total.toFixed(1)) }
                                  }));
                                }}
                                style={{ padding: '6px 8px', borderRadius: '6px', border: `1px solid ${hasError ? '#EF4444' : '#D1D5DB'}`, fontSize: '13px', fontWeight: '500', backgroundColor: 'white' }}
                              >
                                {['00', '15', '30', '45'].map(m => <option key={m} value={m}>{m}</option>)}
                              </select>
                              {/* AM/PM Dropdown */}
                              <select
                                value={(() => {
                                  const [h24Str] = (config.to || '18:00').split(':');
                                  const h24 = parseInt(h24Str || '18', 10);
                                  return h24 >= 12 ? 'PM' : 'AM';
                                })()}
                                onChange={(e) => {
                                  const newAmPm = e.target.value;
                                  const [h24Str, mStr] = (config.to || '18:00').split(':');
                                  let h = parseInt(h24Str || '18', 10) % 12 || 12;
                                  if (newAmPm === 'PM' && h < 12) h += 12;
                                  if (newAmPm === 'AM' && h === 12) h = 0;
                                  const to = `${h.toString().padStart(2, '0')}:${mStr || '00'}`;
                                  
                                  const baseAvail = formData.workSchedule?.availability ?? {};
                                  const newAvailability = { ...baseAvail };
                                  newAvailability[dayKey] = { ...config, to };
                                  let total = 0;
                                  Object.values(newAvailability).forEach(cfg => {
                                    if (cfg.available) total += calculateDayHours(cfg.from, cfg.to);
                                  });
                                  setFormData(prev => ({
                                    ...prev,
                                    workSchedule: { ...prev.workSchedule, availability: newAvailability, weeklyHours: parseFloat(total.toFixed(1)) }
                                  }));
                                }}
                                style={{ padding: '6px 8px', borderRadius: '6px', border: `1px solid ${hasError ? '#EF4444' : '#D1D5DB'}`, fontSize: '13px', fontWeight: '700', backgroundColor: '#F9FAFB' }}
                              >
                                <option value="AM">AM</option>
                                <option value="PM">PM</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginLeft: 'auto' }}>
                          <span style={{ fontSize: '13px', fontWeight: '500', color: hasError ? '#EF4444' : '#10B981' }}>
                            {dayHours} hrs
                          </span>
                          {hasError && <span style={{ fontSize: '10px', color: '#EF4444' }}>Min 30 mins required</span>}
                        </div>
                      </div>
                    ) : (
                      <span style={{ fontSize: '13px', color: '#9CA3AF', fontStyle: 'italic', marginLeft: 'auto' }}>Day Off</span>
                    )}
                  </div>
                )
              })}

              <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <label style={{ display: 'flex', alignItems: 'start', gap: '12px', cursor: (formData.workSchedule?.weeklyHours ?? 0) >= 20 ? 'pointer' : 'not-allowed' }}>
                  <input
                    type="checkbox"
                    disabled={(formData.workSchedule?.weeklyHours ?? 0) < 20}
                    checked={!!formData.workSchedule?.instantBooking && (formData.workSchedule?.weeklyHours ?? 0) >= 20}
                    onChange={(e) => handleInputChange('workSchedule', {
                      ...(formData.workSchedule || {
                        weeklyHours: 40,
                        daysOff: ['Saturday', 'Sunday'],
                        availability: {},
                        instantBooking: false,
                      }),
                      instantBooking: e.target.checked
                    })}
                    style={{ marginTop: '3px', width: '16px', height: '16px' }}
                  />
                  <div>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: (formData.workSchedule?.weeklyHours ?? 0) >= 20 ? '#1F2937' : '#9CA3AF' }}>
                      Available for Instant Booking
                    </span>
                    <p style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                      Allow clients to book you directly without a manual inquiry if they accept your terms.
                    </p>
                    {(formData.workSchedule?.weeklyHours ?? 0) < 20 && (
                      <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px', color: '#B45309', fontSize: '11px', backgroundColor: '#FFFBEB', padding: '6px 10px', borderRadius: '4px', border: '1px solid #FEF3C7' }}>
                        <FiInfo size={14} />
                        <span>Please set your weekly availability to at least 20 hours to enable instant booking.</span>
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {showDashboardVerifiedSave ? (
          <div
            style={{
              marginTop: '28px',
              paddingTop: '24px',
              borderTop: '1px solid #E5E7EB',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              alignItems: 'center',
            }}
          >
            <Button type="button" onClick={() => onDashboardSave?.()} disabled={!!dashboardSaving}>
              {dashboardSaving ? (
                <>
                  <FiLoader className={styles.spinner} style={{ marginRight: 8 }} /> Saving...
                </>
              ) : (
                <>Save expertise changes</>
              )}
            </Button>
            <span style={{ fontSize: '13px', color: '#6B7280' }}>
              Updates here apply immediately to your profile; they are not submitted for admin approval.
            </span>
          </div>
        ) : null}

      </Card>
    </div>
  )
}

export default ExpertiseStep

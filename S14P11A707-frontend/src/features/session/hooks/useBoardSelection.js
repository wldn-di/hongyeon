import { useState, useEffect, useCallback } from 'react'
import {
  loadBoardSelection,
  saveBoardSelection,
  clearBoardSelection,
} from '../utils/boardSelectionStorage'

/**
 * Board selection management hook
 * Stores selections (culprit, weapon, location) in sessionStorage
 * @param {number} sessionId - Session ID
 * @returns {UseBoardSelectionReturn}
 */
export const useBoardSelection = (sessionId) => {
  const [selection, setSelection] = useState({
    culpritId: null,
    culpritName: '',
    weaponClueId: null,
    weaponName: '',
    locationFloor: null,
  })

  /**
   * Load selection from storage
   */
  const loadSelection = useCallback(() => {
    if (!sessionId) return
    const stored = loadBoardSelection(sessionId)
    setSelection(stored)
  }, [sessionId])

  /**
   * Save selection to storage
   */
  const saveSelection = useCallback((newSelection) => {
    if (!sessionId) return
    setSelection(newSelection)
    saveBoardSelection(sessionId, newSelection)
  }, [sessionId])

  /**
   * Set culprit selection
   * @param {number} culpritId - Culprit suspect ID
   * @param {string} culpritName - Culprit name
   */
  const setCulprit = useCallback((culpritId, culpritName = '') => {
    saveSelection({
      ...selection,
      culpritId,
      culpritName,
    })
  }, [selection, saveSelection])

  /**
   * Set weapon selection
   * @param {number} weaponClueId - Weapon clue ID
   * @param {string} weaponName - Weapon name
   */
  const setWeapon = useCallback((weaponClueId, weaponName = '') => {
    saveSelection({
      ...selection,
      weaponClueId,
      weaponName,
    })
  }, [selection, saveSelection])

  /**
   * Set location selection
   * @param {number} locationFloor - Location floor number
   */
  const setLocation = useCallback((locationFloor) => {
    saveSelection({
      ...selection,
      locationFloor,
    })
  }, [selection, saveSelection])

  /**
   * Clear all selections
   */
  const clear = useCallback(() => {
    if (!sessionId) return
    clearBoardSelection(sessionId)
    setSelection({
      culpritId: null,
      culpritName: '',
      weaponClueId: null,
      weaponName: '',
      locationFloor: null,
    })
  }, [sessionId])

  /**
   * Check if all selections are made
   */
  const isComplete = useCallback(() => {
    return !!(
      selection.culpritId &&
      selection.weaponClueId &&
      selection.locationFloor !== null
    )
  }, [selection])

  /**
   * Load selection on mount
   */
  useEffect(() => {
    loadSelection()
  }, [loadSelection])

  return {
    selection,
    setCulprit,
    setWeapon,
    setLocation,
    clear,
    isComplete: isComplete(),
  }
}

/**
 * @typedef {Object} UseBoardSelectionReturn
 * @property {Object} selection - Current selection
 * @property {number|null} selection.culpritId - Culprit suspect ID
 * @property {string} selection.culpritName - Culprit name
 * @property {number|null} selection.weaponClueId - Weapon clue ID
 * @property {string} selection.weaponName - Weapon name
 * @property {number|null} selection.locationFloor - Location floor number
 * @property {Function} setCulprit - Set culprit selection
 * @property {Function} setWeapon - Set weapon selection
 * @property {Function} setLocation - Set location selection
 * @property {Function} clear - Clear all selections
 * @property {boolean} isComplete - Whether all selections are made
 */

export default useBoardSelection

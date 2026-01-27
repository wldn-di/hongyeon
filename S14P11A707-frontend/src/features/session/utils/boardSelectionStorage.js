/**
 * Board selection storage utility
 * Stores board selections (culprit, weapon, location) in sessionStorage
 */

const STORAGE_KEY_PREFIX = 'board-selection-'

/**
 * Get selection storage key for a session
 * @param {number} sessionId - Session ID
 * @returns {string} Storage key
 */
const getStorageKey = (sessionId) => {
  return `${STORAGE_KEY_PREFIX}${sessionId}`
}

/**
 * Default selection values
 */
const defaultSelection = {
  culpritId: null,
  culpritName: '',
  weaponClueId: null,
  weaponName: '',
  locationFloor: null,
}

/**
 * Load board selection from sessionStorage
 * @param {number} sessionId - Session ID
 * @returns {Object} Board selection
 */
export const loadBoardSelection = (sessionId) => {
  if (!sessionId) {
    return { ...defaultSelection }
  }

  try {
    const key = getStorageKey(sessionId)
    const stored = sessionStorage.getItem(key)
    if (stored) {
      return { ...defaultSelection, ...JSON.parse(stored) }
    }
  } catch (error) {
    console.error('Failed to load board selection:', error)
  }

  return { ...defaultSelection }
}

/**
 * Save board selection to sessionStorage
 * @param {number} sessionId - Session ID
 * @param {Object} selection - Selection data
 * @param {number|null} selection.culpritId - Culprit suspect ID
 * @param {string} selection.culpritName - Culprit name
 * @param {number|null} selection.weaponClueId - Weapon clue ID
 * @param {string} selection.weaponName - Weapon name
 * @param {number|null} selection.locationFloor - Location floor number
 */
export const saveBoardSelection = (sessionId, selection) => {
  if (!sessionId) return

  try {
    const key = getStorageKey(sessionId)
    sessionStorage.setItem(key, JSON.stringify(selection))
  } catch (error) {
    console.error('Failed to save board selection:', error)
  }
}

/**
 * Update a single field in board selection
 * @param {number} sessionId - Session ID
 * @param {string} field - Field name
 * @param {any} value - Field value
 */
export const updateBoardSelectionField = (sessionId, field, value) => {
  const current = loadBoardSelection(sessionId)
  const updated = { ...current, [field]: value }
  saveBoardSelection(sessionId, updated)
}

/**
 * Clear board selection for a session
 * @param {number} sessionId - Session ID
 */
export const clearBoardSelection = (sessionId) => {
  if (!sessionId) return

  try {
    const key = getStorageKey(sessionId)
    sessionStorage.removeItem(key)
  } catch (error) {
    console.error('Failed to clear board selection:', error)
  }
}

/**
 * Clear all board selections (useful for testing)
 */
export const clearAllBoardSelections = () => {
  try {
    const keys = Object.keys(sessionStorage)
    for (const key of keys) {
      if (key.startsWith(STORAGE_KEY_PREFIX)) {
        sessionStorage.removeItem(key)
      }
    }
  } catch (error) {
    console.error('Failed to clear all board selections:', error)
  }
}

export default {
  loadBoardSelection,
  saveBoardSelection,
  updateBoardSelectionField,
  clearBoardSelection,
  clearAllBoardSelections,
}

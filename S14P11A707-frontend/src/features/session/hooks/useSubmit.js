import { useState, useEffect, useCallback } from 'react'
import { validateSubmit, submitFinalAnswer } from '../api/sessionApi'
import {
  normalizeSubmitValidateResponse,
  normalizeSubmitResponse,
} from '../api/sessionMappers'
import { getErrorMessage } from '@/api/errors/errorHandler'

/**
 * Submit validation and submission hook
 * @param {number} sessionId - Session ID
 * @returns {UseSubmitReturn}
 */
export const useSubmit = (sessionId) => {
  const [validation, setValidation] = useState(null)
  const [submitResult, setSubmitResult] = useState(null)
  const [isValidating, setIsValidating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  /**
   * Validate submit requirements
   */
  const validate = useCallback(async () => {
    if (!sessionId) return

    setIsValidating(true)
    setError(null)

    try {
      const response = await validateSubmit(sessionId)
      const normalized = normalizeSubmitValidateResponse(response)
      setValidation(normalized)
      return normalized
    } catch (err) {
      console.error('Submit validation failed:', err)
      const errorMessage = getErrorMessage(err)
      setError(errorMessage)
      setValidation(null)
      return null
    } finally {
      setIsValidating(false)
    }
  }, [sessionId])

  /**
   * Submit final answer
   * @param {Object} data - Submit data
   * @param {number} data.culpritId - Culprit suspect ID
   * @param {number} data.weaponClueId - Weapon clue ID
   * @param {number} data.locationFloor - Location floor number
   * @param {string} data.motive - Motive text
   * @param {string} data.causeOfDeath - Cause of death text
   */
  const submit = useCallback(async ({ culpritId, weaponClueId, locationFloor, motive, causeOfDeath }) => {
    if (!sessionId) return

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await submitFinalAnswer(sessionId, {
        culpritId,
        weaponClueId,
        locationFloor,
        motive,
        causeOfDeath,
      })
      const normalized = normalizeSubmitResponse(response)
      setSubmitResult(normalized)
      return normalized
    } catch (err) {
      console.error('Submit failed:', err)
      const errorMessage = getErrorMessage(err)
      setError(errorMessage)
      setSubmitResult(null)
      return null
    } finally {
      setIsSubmitting(false)
    }
  }, [sessionId])

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setValidation(null)
    setSubmitResult(null)
    setError(null)
  }, [])

  /**
   * Initial validation on mount
   */
  useEffect(() => {
    validate()
  }, [validate])

  return {
    validation,
    submitResult,
    isValidating,
    isSubmitting,
    error,
    validate,
    submit,
    reset,
  }
}

/**
 * @typedef {Object} UseSubmitReturn
 * @property {Object|null} validation - Validation result
 * @property {boolean} validation.submittable - Whether submission is allowed
 * @property {Array<string>} validation.missing - Missing required items
 * @property {Array} validation.requiredRedConnections - Required red connections
 * @property {Object|null} submitResult - Submit result
 * @property {string} submitResult.status - Submission status
 * @property {number} submitResult.finalScore - Final score
 * @property {string} submitResult.rankGrade - Rank grade
 * @property {Object} submitResult.evaluation - Evaluation details
 * @property {boolean} isValidating - Validating state
 * @property {boolean} isSubmitting - Submitting state
 * @property {string|null} error - Error message
 * @property {Function} validate - Validate function
 * @property {Function} submit - Submit function
 * @property {Function} reset - Reset state
 */

export default useSubmit

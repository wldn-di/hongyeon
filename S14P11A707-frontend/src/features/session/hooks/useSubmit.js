import { useState, useCallback } from 'react'
import { submitAnswer } from '../api/sessionApi'
import { normalizeGameEndResponse } from '../api/sessionMappers'
import { getErrorMessage } from '@/api/errors/errorHandler'

/**
 * Submit hook - handles final answer submission
 * @param {number} sessionId - Session ID
 * @returns {UseSubmitReturn}
 */
export const useSubmit = (sessionId) => {
  const [submitResult, setSubmitResult] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  /**
   * Submit final answer
   * @param {Object} submitData - { culpritId, weaponClueId, locationFloor, motive }
   */
  const submit = useCallback(async (submitData) => {
    if (!sessionId) {
      setError(new Error('세션 ID가 필요합니다.'))
      return null
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await submitAnswer(sessionId, submitData)
      const normalized = normalizeGameEndResponse(response)
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
    setSubmitResult(null)
    setError(null)
  }, [])

  return {
    submitResult,
    isSubmitting,
    error,
    submit,
    reset,
  }
}

/**
 * @typedef {Object} UseSubmitReturn
 * @property {Object|null} submitResult - Submit result
 * @property {string} submitResult.status - Submission status
 * @property {boolean} submitResult.isSuccess - Whether the deduction was correct
 * @property {number} submitResult.finalScore - Final score
 * @property {string} submitResult.rankGrade - Rank grade (S, A, B, C, F)
 * @property {boolean} isSubmitting - Submitting state
 * @property {string|null} error - Error message
 * @property {Function} submit - Submit function (ends the game)
 * @property {Function} reset - Reset state
 */

export default useSubmit

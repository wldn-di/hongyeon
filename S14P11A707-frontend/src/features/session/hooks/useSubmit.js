import { useState, useCallback } from 'react'
import { endGame } from '../api/sessionApi'
import { normalizeGameEndResponse } from '../api/sessionMappers'
import { getErrorMessage } from '@/api/errors/errorHandler'

/**
 * Submit hook - handles game ending (final answer submission)
 * Based on OpenAPI spec, submission is done via endGame endpoint
 * The backend evaluates the board state to determine the result
 * @param {number} sessionId - Session ID
 * @returns {UseSubmitReturn}
 */
export const useSubmit = (sessionId) => {
  const [submitResult, setSubmitResult] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  /**
   * Submit final answer (end game)
   * The backend evaluates the current board state to calculate score and grade
   */
  const submit = useCallback(async () => {
    if (!sessionId) {
      setError(new Error('세션 ID가 필요합니다.'))
      return null
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await endGame(sessionId)
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

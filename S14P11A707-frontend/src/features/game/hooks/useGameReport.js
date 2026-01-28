import { useState, useCallback } from 'react'
import { fetchMyReport } from '@/features/session/api/sessionApi'
import { normalizeInvestigationReportResponse } from '@/features/session/api/sessionMappers'
import { createReview } from '@/features/scenarios/api/reviewsApi'
import { toast } from 'sonner'

/**
 * 게임 수사보고서 조회 및 리뷰 작성 Hook
 * @returns {Object} { report, loading, error, fetchReport, submitReview }
 */
export function useGameReport() {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  /**
   * 수사보고서 조회
   * @param {number} sessionId
   * @returns {Promise<Object>} 수사보고서 데이터
   */
  const fetchReport = useCallback(async (sessionId) => {
    if (!sessionId) {
      const err = new Error('세션 ID가 필요합니다.')
      setError(err)
      return null
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetchMyReport(sessionId)
      const normalized = normalizeInvestigationReportResponse(response)
      setReport(normalized)

      return normalized
    } catch (err) {
      setError(err)
      toast.error('수사보고서를 불러오는데 실패했습니다.')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * 리뷰 작성
   * @param {number} scenarioId
   * @param {Object} reviewData - { rating, difficulty, content, isSpoiler }
   * @returns {Promise<Object>} 작성된 리뷰
   */
  const submitReview = useCallback(async (scenarioId, reviewData) => {
    if (!scenarioId) {
      const err = new Error('시나리오 ID가 필요합니다.')
      setError(err)
      toast.error('시나리오 정보를 찾을 수 없습니다.')
      throw err
    }

    try {
      setLoading(true)
      setError(null)

      const response = await createReview(scenarioId, reviewData)
      toast.success('리뷰가 작성되었습니다.')

      return response
    } catch (err) {
      setError(err)
      toast.error(err.response?.data?.message || '리뷰 작성에 실패했습니다.')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    report,
    loading,
    error,
    fetchReport,
    submitReview,
    reset: () => {
      setReport(null)
      setLoading(false)
      setError(null)
    },
  }
}

export default useGameReport

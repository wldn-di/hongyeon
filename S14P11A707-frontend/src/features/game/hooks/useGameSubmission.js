import { useState, useCallback } from 'react'
import { submitAnswer } from '@/features/session/api/sessionApi'
import { toast } from 'sonner'

/**
 * 게임 정답 제출 및 결과 처리 Hook
 * @returns {Object} { submitGame, loading, error, sessionId, result }
 */
export function useGameSubmission() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [sessionId, setSessionId] = useState(null)
  const [result, setResult] = useState(null)

  /**
   * 게임 종료 (정답 제출)
   * @param {number} currentSessionId
   * @param {Object} submitData - { culpritId, weaponClueId, locationFloor, motive }
   * @returns {Promise<Object>} 게임 종료 결과
   */
  const submitGame = useCallback(async (currentSessionId, submitData) => {
    if (!currentSessionId) {
      const err = new Error('세션 ID가 필요합니다.')
      setError(err)
      toast.error('세션 정보를 찾을 수 없습니다.')
      throw err
    }

    try {
      setLoading(true)
      setError(null)

      const response = await submitAnswer(currentSessionId, submitData)

      setSessionId(currentSessionId)
      setResult(response)

      if (response.isSuccess) {
        toast.success('사건이 해결되었습니다!')
      } else {
        toast.error('추리가 틀렸습니다. 다시 도전해주세요.')
      }

      return response
    } catch (err) {
      setError(err)
      toast.error(err.message || '제출에 실패했습니다.')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    submitGame,
    loading,
    error,
    sessionId,
    result,
    reset: () => {
      setLoading(false)
      setError(null)
      setSessionId(null)
      setResult(null)
    },
  }
}

export default useGameSubmission

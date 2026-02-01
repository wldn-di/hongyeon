import { useState, useEffect, useCallback } from 'react'
import { fetchBookshelfSessions } from '@/features/user/api/userApi'
import { mapBookshelfSessionResponse } from '@/features/session/api/sessionMappers'

/**
 * 특정 시나리오의 플레이 상태를 확인하는 Hook
 * @param {number} scenarioId - 확인할 시나리오 ID
 * @returns {Object} { status, session, loading, error, refetch }
 */
export function useScenarioPlayStatus(scenarioId) {
  const [status, setStatus] = useState(null) // 'COMPLETED' | 'PLAYING' | 'FAILED' | null
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    if (!scenarioId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetchBookshelfSessions()
      const mappedSessions = mapBookshelfSessionResponse(response)
      // mapBookshelfSessionResponse 내부에서 이미 mapBookshelfItem을 호출하므로 중복 호출 제거
      const items = mappedSessions.content.filter(Boolean)

      // 해당 시나리오의 세션 찾기 (타입 안전한 비교)
      const matchedSession = items.find(item => Number(item.scenarioId) === Number(scenarioId))

      if (matchedSession) {
        setStatus(matchedSession.status)
        setSession(matchedSession)
      } else {
        setStatus(null)
        setSession(null)
      }
    } catch (err) {
      // 로그인하지 않은 경우 등 에러 발생 시 null 처리
      setStatus(null)
      setSession(null)
      setError(err)
      console.error('useScenarioPlayStatus error:', err)
    } finally {
      setLoading(false)
    }
  }, [scenarioId])

  useEffect(() => {
    fetch()
  }, [fetch])

  return {
    // 상태
    status,
    session,
    loading,
    error,
    refetch: fetch,
    // 편의 속성
    isCompleted: status === 'COMPLETED',
    isFailed: status === 'FAILED',
    isPlaying: status === 'PLAYING',
    hasPlayed: status === 'COMPLETED' || status === 'FAILED',
  }
}

export default useScenarioPlayStatus
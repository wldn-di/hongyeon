import { useState, useEffect } from 'react'
import { fetchEventLogs } from '../../session/api/logsApi'
import { normalizeEventLogListResponse } from '../../session/api/sessionMappers'
import { toast } from 'sonner'

/**
 * 게임 세션 이벤트 로그 조회 Hook
 * @param {number} sessionId - 세션 ID
 * @returns {Object} { logs, loading, error, refetch }
 */
export function useGameLogs(sessionId) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = async () => {
    if (!sessionId) {
      setLogs([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const response = await fetchEventLogs(Number(sessionId))
      const mapped = normalizeEventLogListResponse(response)
      setLogs(mapped.logs)
    } catch (err) {
      setError(err)
      toast.error('수사 로그를 불러오는데 실패했습니다.')
      console.error('useGameLogs error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetch()
  }, [sessionId])

  return {
    logs,
    loading,
    error,
    refetch: fetch,
  }
}

export default useGameLogs

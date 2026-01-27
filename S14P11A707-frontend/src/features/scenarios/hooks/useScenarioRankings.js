import { useState, useEffect } from 'react'
import { fetchScenarioRankings } from '../api/scenariosApi'
import { mapScenarioRankingResponse } from '../api/scenarioMappers'
import { toast } from 'sonner'

/**
 * 시나리오 랭킹 조회 Hook
 * @param {number} scenarioId - 시나리오 ID
 * @returns {Object} { rankings, hasUserCleared, loading, error, refetch }
 */
export function useScenarioRankings(scenarioId) {
  const [data, setData] = useState({
    rankings: [],
    hasUserCleared: false,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = async () => {
    if (!scenarioId) {
      setData({ rankings: [], hasUserCleared: false })
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const response = await fetchScenarioRankings(Number(scenarioId))
      const mapped = mapScenarioRankingResponse(response)
      setData({
        rankings: mapped.rankings,
        hasUserCleared: mapped.hasUserCleared,
      })
    } catch (err) {
      setError(err)
      toast.error('시나리오 랭킹을 불러오는데 실패했습니다.')
      console.error('useScenarioRankings error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetch()
  }, [scenarioId])

  return {
    rankings: data.rankings,
    hasUserCleared: data.hasUserCleared,
    loading,
    error,
    refetch: fetch,
  }
}

export default useScenarioRankings

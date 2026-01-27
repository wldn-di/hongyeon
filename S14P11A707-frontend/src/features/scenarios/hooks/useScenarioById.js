import { useState, useEffect } from 'react'
import { fetchScenarioDetail } from '../api/scenariosApi'
import { mapScenarioDetailResponse } from '../api/scenarioMappers'
import { toast } from 'sonner'

/**
 * 시나리오 상세 조회 Hook
 * @param {number|string} id - 시나리오 ID
 * @returns {Object} { scenario, loading, error, refetch }
 */
export function useScenarioById(id) {
  const [scenario, setScenario] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = async () => {
    if (!id) {
      setScenario(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const response = await fetchScenarioDetail(Number(id))
      const mapped = mapScenarioDetailResponse(response)
      setScenario(mapped)
    } catch (err) {
      setError(err)
      toast.error('시나리오 상세 정보를 불러오는데 실패했습니다.')
      console.error('useScenarioById error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetch()
  }, [id])

  return {
    scenario,
    loading,
    error,
    refetch: fetch,
  }
}

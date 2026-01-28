import { useState, useEffect } from 'react'
import { fetchScenarioVictim } from '../api/scenariosApi'
import { mapVictimResponse } from '../api/scenarioMappers'
import { toast } from 'sonner'

/**
 * 피해자 정보 조회 Hook
 * @param {number|string} scenarioId - 시나리오 ID
 * @returns {Object} { victim, loading, error }
 */
export function useVictim(scenarioId) {
  const [victim, setVictim] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!scenarioId) {
      setVictim(null)
      return
    }

    const fetch = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetchScenarioVictim(Number(scenarioId))
        const mapped = mapVictimResponse(response)
        setVictim(mapped)
      } catch (err) {
        setError(err)
        console.error('useVictim error:', err)
        // 피해자 정보는 실패해도 치명적이 아니므로 toast는 띄우지 않음
      } finally {
        setLoading(false)
      }
    }

    fetch()
  }, [scenarioId])

  return {
    victim,
    loading,
    error,
  }
}

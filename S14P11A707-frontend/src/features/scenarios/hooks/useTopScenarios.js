import { useEffect, useState } from 'react'
import { fetchTopScenariosByPlayCount, fetchTopScenariosByRating } from '../api/scenariosApi'
import { mapScenarioListResponseFull } from '../api/scenarioMappers'

/**
 * TOP 시나리오(평점/플레이수) 조회 Hook
 * - API 실패 시 섹션만 숨김(null)
 * - 성공하되 빈 배열인 경우는 섹션을 유지([])
 * @param {Object} [options]
 * @param {boolean} [options.enabled=true]
 */
export function useTopScenarios(options = {}) {
  const { enabled = true } = options

  const [topByRating, setTopByRating] = useState(null)
  const [topByPlayCount, setTopByPlayCount] = useState(null)

  useEffect(() => {
    if (!enabled) return

    let cancelled = false

    const fetch = async () => {
      const [ratingRes, playRes] = await Promise.allSettled([
        fetchTopScenariosByRating(),
        fetchTopScenariosByPlayCount(),
      ])

      if (cancelled) return

      if (ratingRes.status === 'fulfilled') {
        const mapped = mapScenarioListResponseFull(ratingRes.value)
        setTopByRating((mapped.content || []).slice(0, 10))
      } else {
        setTopByRating(null)
      }

      if (playRes.status === 'fulfilled') {
        const mapped = mapScenarioListResponseFull(playRes.value)
        setTopByPlayCount((mapped.content || []).slice(0, 10))
      } else {
        setTopByPlayCount(null)
      }
    }

    fetch()

    return () => {
      cancelled = true
    }
  }, [enabled])

  return { topByRating, topByPlayCount }
}

export default useTopScenarios


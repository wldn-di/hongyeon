import { useState, useEffect } from 'react'
import { fetchScenarioRooms, fetchScenarioVictim } from '../../scenarios/api/scenariosApi'
import { mapRoomListResponse, mapVictimResponse } from '../../scenarios/api/scenarioMappers'
import { toast } from 'sonner'

/**
 * 시나리오 방 정보 조회 Hook
 * @param {number} scenarioId - 시나리오 ID
 * @returns {Object} { rooms, victim, loading, error, refetch }
 */
export function useGameRooms(scenarioId) {
  const [rooms, setRooms] = useState([])
  const [victim, setVictim] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = async () => {
    if (!scenarioId) {
      setRooms([])
      setVictim(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // 방 정보와 피해자 정보 병렬 조회
      const [roomsResponse, victimResponse] = await Promise.all([
        fetchScenarioRooms(Number(scenarioId)),
        fetchScenarioVictim(Number(scenarioId)).catch(() => null), // 피해자 정보는 없을 수 있음
      ])

      const mappedRooms = mapRoomListResponse(roomsResponse)
      setRooms(mappedRooms)

      if (victimResponse) {
        const mappedVictim = mapVictimResponse(victimResponse)
        setVictim(mappedVictim)
      }
    } catch (err) {
      setError(err)
      toast.error('방 정보를 불러오는데 실패했습니다.')
      console.error('useGameRooms error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetch()
  }, [scenarioId])

  return {
    rooms,
    victim,
    loading,
    error,
    refetch: fetch,
  }
}

export default useGameRooms

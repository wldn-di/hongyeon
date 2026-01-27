import { useState, useEffect, useCallback, useRef } from 'react'
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

  // scenarioId를 ref로 관리
  const scenarioIdRef = useRef(scenarioId)
  useEffect(() => {
    scenarioIdRef.current = scenarioId
  }, [scenarioId])

  const fetchRooms = useCallback(async () => {
    const currentScenarioId = scenarioIdRef.current
    if (!currentScenarioId) {
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
        fetchScenarioRooms(Number(currentScenarioId)),
        fetchScenarioVictim(Number(currentScenarioId)).catch(() => null), // 피해자 정보는 없을 수 있음
      ])

      // 백엔드 응답이 배열인 경우 직접 처리
      let mappedRooms
      if (Array.isArray(roomsResponse)) {
        // 응답이 직접 배열인 경우
        mappedRooms = roomsResponse.map((room, idx) => ({
          id: room.roomId || room.id || idx,
          floorNumber: room.floorNumber ?? idx,
          roomType: room.roomType || 'default',
          name: room.roomName || room.name || `${idx + 1}층`,
          description: room.description || '',
          assistantComment: room.assistantComment || '',
          objects: room.objects || null,
          unlocked: true,
          image: `/images/rooms/room-${room.roomId || idx}.png`,
        }))
      } else {
        mappedRooms = mapRoomListResponse(roomsResponse)
      }

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
  }, [])

  useEffect(() => {
    fetchRooms()
  }, [scenarioId, fetchRooms])

  return {
    rooms,
    victim,
    loading,
    error,
    refetch: fetchRooms,
  }
}

export default useGameRooms

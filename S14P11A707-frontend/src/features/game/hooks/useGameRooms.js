import { useState, useEffect, useCallback } from 'react'
import { fetchScenarioRooms, fetchScenarioVictim } from '../../scenarios/api/scenariosApi'
import { mapRoomListResponse, mapVictimResponse } from '../../scenarios/api/scenarioMappers'
import { toast } from 'sonner'

const clampFloor = (value, fallback = 1) => {
  const num = Number(value)
  if (!Number.isFinite(num)) return fallback
  return Math.min(6, Math.max(1, Math.trunc(num)))
}

/**
 * 시나리오 방 정보 조회 Hook
 * @param {number} scenarioId - 시나리오 ID
 * @param {Object} [options]
 * @param {boolean} [options.enabled=true]
 * @returns {Object} { rooms, victim, loading, error, refetch }
 */
export function useGameRooms(scenarioId, options = {}) {
  const { enabled = true } = options
  const [rooms, setRooms] = useState([])
  const [victim, setVictim] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchRooms = useCallback(async (id) => {
    if (!enabled) {
      setRooms([])
      setVictim(null)
      setError(null)
      setLoading(false)
      return
    }

    if (!id) {
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
        fetchScenarioRooms(Number(id)),
        fetchScenarioVictim(Number(id)).catch(() => null), // 피해자 정보는 없을 수 있음
      ])

      // 백엔드 응답이 배열인 경우 직접 처리
      let mappedRooms
      if (Array.isArray(roomsResponse)) {
        // 디버깅용 로그
        console.log('[useGameRooms] Raw roomsResponse:', roomsResponse)
        console.log('[useGameRooms] First room data:', roomsResponse[0])
        // 응답이 직접 배열인 경우
        mappedRooms = roomsResponse.map((room, idx) => ({
          id: room.roomId || room.id || idx,
          floorNumber: clampFloor(room.floorNumber, idx + 1),
          roomType: room.roomType || 'default',
          name: room.roomName || room.name || `${idx + 1}층`,
          description: room.description || '',
          assistantComment: room.assistantComment || room.assistant_comment || '',
          objects: room.objects || null,
          unlocked: true,
          image: room.backgroundImageUrl || `/images/rooms/room-${room.roomId || idx}.png`,
        }))
        console.log('[useGameRooms] Mapped rooms:', mappedRooms)
      } else {
        console.log('[useGameRooms] Using mapRoomListResponse, response:', roomsResponse)
        mappedRooms = mapRoomListResponse(roomsResponse).map((room, idx) => ({
          ...room,
          floorNumber: clampFloor(room?.floorNumber, idx + 1),
        }))
        console.log('[useGameRooms] Mapped rooms (via mapper):', mappedRooms)
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
  }, [enabled])

  useEffect(() => {
    fetchRooms(scenarioId)
  }, [scenarioId, enabled, fetchRooms])

  return {
    rooms,
    victim,
    loading,
    error,
    refetch: () => fetchRooms(scenarioId),
  }
}

export default useGameRooms

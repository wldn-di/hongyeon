import { useState, useEffect, useCallback } from 'react'
import { fetchBoard } from '../api/sessionApi'
import { fetchClues } from '../api/cluesApi'
import { fetchScenarioSuspects } from '@/features/scenarios/api/scenariosApi'
import {
  normalizeBoardResponse,
  normalizeClueListResponse,
  normalizeSuspectListResponse,
} from '../api/sessionMappers'
import { getErrorMessage } from '@/api/errors/errorHandler'

/**
 * 추리보드 데이터 관리 Hook
 * - localStorage 기반으로 작동
 * - API는 조회만 사용 (저장은 InvestigationBoard에서 직접)
 */
export const useBoard = (sessionId, scenarioId) => {
  const [boardData, setBoardData] = useState(null)
  const [clues, setClues] = useState([])
  const [suspects, setSuspects] = useState([])
  const [boardItems, setBoardItems] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)

  /**
   * 보드 데이터 로드 (API에서 조회)
   */
  const fetchBoardData = useCallback(async () => {
    if (!sessionId) return

    setIsLoading(true)
    setError(null)

    try {
      // 보드, 단서 병렬 조회
      const [boardResponse, cluesResponse] = await Promise.all([
        fetchBoard(sessionId),
        fetchClues(sessionId),
      ])

      const normalizedBoard = normalizeBoardResponse(boardResponse)
      const normalizedClues = normalizeClueListResponse(cluesResponse)

      setBoardData(normalizedBoard)
      setClues(normalizedClues.clues)

      // 용의자 조회
      if (scenarioId) {
        try {
          const suspectsResponse = await fetchScenarioSuspects(scenarioId)
          const normalizedSuspects = normalizeSuspectListResponse(suspectsResponse)
          setSuspects(normalizedSuspects.suspects)
        } catch (suspectErr) {
          console.error('Failed to fetch suspects:', suspectErr)
        }
      }
    } catch (err) {
      console.error('Board data load failed:', err)
      const errorMessage = getErrorMessage(err)
      setError(errorMessage)
      setBoardData(null)
      setClues([])
      setSuspects([])
      setBoardItems([])
    } finally {
      setIsLoading(false)
    }
  }, [sessionId, scenarioId])

  /**
   * 노드 위치 업데이트 (로컬 상태만)
   */
  const updateNodePosition = useCallback((nodeId, x, y) => {
    setBoardItems(prev =>
      prev.map(item =>
        item.id === nodeId ? { ...item, x, y } : item
      )
    )
  }, [])

  /**
   * 보드 새로고침
   */
  const refetch = useCallback(() => {
    fetchBoardData()
  }, [fetchBoardData])

  /**
   * 초기 로드
   */
  useEffect(() => {
    fetchBoardData()
  }, [fetchBoardData])

  return {
    boardData,
    clues,
    suspects,
    boardItems,
    setBoardItems,
    isLoading,
    isSaving,
    error,
    refetch,
    updateNodePosition,
  }
}

export default useBoard
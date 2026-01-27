import { useState, useEffect, useCallback } from 'react'
import { fetchBoard, fetchClues, fetchSuspects, updateBoardNodePosition } from '../api/sessionApi'
import {
  normalizeBoardResponse,
  normalizeClueListResponse,
  normalizeSuspectListResponse,
  createBoardItems,
} from '../api/sessionMappers'
import { getErrorMessage } from '@/api/errors/errorHandler'

/**
 * Board data management hook
 * @param {number} sessionId - Session ID
 * @param {number} [scenarioId] - Scenario ID (optional, for fetching suspects)
 * @returns {UseBoardReturn}
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
   * Fetch board data
   */
  const fetchBoardData = useCallback(async () => {
    if (!sessionId) return

    setIsLoading(true)
    setError(null)

    try {
      // Fetch board and clues in parallel
      const [boardResponse, cluesResponse] = await Promise.all([
        fetchBoard(sessionId),
        fetchClues(sessionId),
      ])

      const normalizedBoard = normalizeBoardResponse(boardResponse)
      const normalizedClues = normalizeClueListResponse(cluesResponse)

      setBoardData(normalizedBoard)
      setClues(normalizedClues.clues)

      // Fetch suspects if scenarioId is provided
      if (scenarioId) {
        try {
          const suspectsResponse = await fetchSuspects(scenarioId)
          const normalizedSuspects = normalizeSuspectListResponse(suspectsResponse)
          setSuspects(normalizedSuspects.suspects)

          // Create UI board items
          const items = createBoardItems(normalizedBoard, normalizedSuspects.suspects, normalizedClues.clues)
          setBoardItems(items)
        } catch (suspectErr) {
          console.error('Failed to fetch suspects:', suspectErr)
          // Continue without suspects - board items will be created without suspect data
          const items = createBoardItems(normalizedBoard, [], normalizedClues.clues)
          setBoardItems(items)
        }
      } else {
        // Create UI board items without suspects
        const items = createBoardItems(normalizedBoard, [], normalizedClues.clues)
        setBoardItems(items)
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
   * Update node position
   * @param {number} nodeId - Node ID
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  const updateNodePosition = useCallback(async (nodeId, x, y) => {
    if (!sessionId || isSaving) return

    // Optimistic update
    setBoardItems(prev =>
      prev.map(item =>
        item.id === nodeId ? { ...item, x, y } : item
      )
    )

    setIsSaving(true)
    try {
      await updateBoardNodePosition(sessionId, { nodeId, x, y })
    } catch (err) {
      console.error('Board node position update failed:', err)
      // Revert on error
      setBoardItems(prev =>
        prev.map(item =>
          item.id === nodeId ? { ...item, x: item.x, y: item.y } : item
        )
      )
    } finally {
      setIsSaving(false)
    }
  }, [sessionId, isSaving])

  /**
   * Refetch board data
   */
  const refetch = useCallback(() => {
    fetchBoardData()
  }, [fetchBoardData])

  /**
   * Initial load
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

/**
 * @typedef {Object} UseBoardReturn
 * @property {Object|null} boardData - Raw board data from API
 * @property {Array} clues - List of clues
 * @property {Array} suspects - List of suspects
 * @property {Array} boardItems - UI-compatible board items
 * @property {Function} setBoardItems - Set board items state
 * @property {boolean} isLoading - Loading state
 * @property {boolean} isSaving - Saving state
 * @property {string|null} error - Error message
 * @property {Function} refetch - Refetch board data
 * @property {Function} updateNodePosition - Update node position
 */

export default useBoard

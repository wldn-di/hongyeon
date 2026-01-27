import { apiClient } from '@/api/client/axios'
import { ENDPOINTS } from '@/api/endpoints'
import { ApiError } from '@/api/errors/ApiError'

/**
 * Session API Module
 * OpenAPI spec 기반으로 작성됨
 */

// ========================================
// Game Start/Resume/End API
// ========================================

/**
 * 게임 시작 (POST /api/sessions/{scenarioId})
 * @param {number} scenarioId
 * @returns {Promise<GameStartResponse>}
 * @throws {ApiError}
 */
export const startGame = async (scenarioId) => {
  try {
    const response = await apiClient.post(ENDPOINTS.sessions.start(scenarioId))
    return response.data
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error)
    }
    throw new ApiError('게임 시작에 실패했습니다.')
  }
}

/**
 * 이어하기 (GET /api/sessions/{sessionId}/resume)
 * @param {number} sessionId
 * @returns {Promise<GameResumeResponse>}
 * @throws {ApiError}
 */
export const fetchResume = async (sessionId) => {
  try {
    const response = await apiClient.get(ENDPOINTS.sessions.resume(sessionId))
    return response.data
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error)
    }
    throw new ApiError('이어하기 데이터를 불러오는데 실패했습니다.')
  }
}

/**
 * 게임 저장 (PATCH /api/sessions/{sessionId})
 * @param {number} sessionId
 * @param {GameSaveRequest} data - { currentFloor, visitedFloors, health, playTime }
 * @returns {Promise<GameSaveResponse>}
 * @throws {ApiError}
 */
export const saveGame = async (sessionId, data) => {
  try {
    const response = await apiClient.patch(ENDPOINTS.sessions.save(sessionId), data)
    return response.data
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error)
    }
    throw new ApiError('게임 저장에 실패했습니다.')
  }
}

/**
 * 게임 종료 (POST /api/sessions/{sessionId}/end)
 * @param {number} sessionId
 * @returns {Promise<GameEndResponse>}
 * @throws {ApiError}
 */
export const endGame = async (sessionId) => {
  try {
    const response = await apiClient.post(ENDPOINTS.sessions.end(sessionId))
    return response.data
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error)
    }
    throw new ApiError('게임 종료에 실패했습니다.')
  }
}

/**
 * 층 이동 (POST /api/sessions/{sessionId}/move-floor)
 * @param {number} sessionId
 * @returns {Promise<FloorMoveResponse>}
 * @throws {ApiError}
 */
export const moveFloor = async (sessionId) => {
  try {
    const response = await apiClient.post(ENDPOINTS.sessions.moveFloor(sessionId))
    return response.data
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error)
    }
    throw new ApiError('층 이동에 실패했습니다.')
  }
}

// ========================================
// Board API
// ========================================

/**
 * 보드 조회 (GET /api/sessions/{sessionId}/board)
 * @param {number} sessionId
 * @returns {Promise<BoardResponse>}
 * @throws {ApiError}
 */
export const fetchBoard = async (sessionId) => {
  try {
    const response = await apiClient.get(ENDPOINTS.sessions.board(sessionId))
    return response.data
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error)
    }
    throw new ApiError('보드 데이터를 불러오는데 실패했습니다.')
  }
}

/**
 * 보드 노드 추가 (POST /api/sessions/{sessionId}/board/nodes)
 * @param {number} sessionId
 * @param {BoardNodeAddRequest} data - { type, targetId, memoContent, x, y }
 * @returns {Promise<BoardResponse>}
 * @throws {ApiError}
 */
export const addBoardNode = async (sessionId, data) => {
  try {
    const response = await apiClient.post(ENDPOINTS.sessions.boardNodes(sessionId), data)
    return response.data
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error)
    }
    throw new ApiError('보드 노드 추가에 실패했습니다.')
  }
}

/**
 * 보드 노드 위치 이동 (PATCH /api/sessions/{sessionId}/board/nodes/position)
 * @param {number} sessionId
 * @param {BoardItemMoveRequest} data - { nodeId, x, y }
 * @returns {Promise<BoardResponse>}
 * @throws {ApiError}
 */
export const moveBoardNode = async (sessionId, data) => {
  try {
    const response = await apiClient.patch(ENDPOINTS.sessions.boardNodePosition(sessionId), data)
    return response.data
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error)
    }
    throw new ApiError('보드 노드 이동에 실패했습니다.')
  }
}

/**
 * 보드 메모 수정 (PATCH /api/sessions/{sessionId}/board/nodes/{nodeId})
 * @param {number} sessionId
 * @param {number} nodeId
 * @param {BoardMemoUpdateRequest} data - { memoContent }
 * @returns {Promise<BoardResponse>}
 * @throws {ApiError}
 */
export const updateBoardMemo = async (sessionId, nodeId, data) => {
  try {
    const response = await apiClient.patch(ENDPOINTS.sessions.boardNodeUpdate(sessionId, nodeId), data)
    return response.data
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error)
    }
    throw new ApiError('메모 수정에 실패했습니다.')
  }
}

/**
 * 보드 연결선 추가 (POST /api/sessions/{sessionId}/board/connections)
 * @param {number} sessionId
 * @param {BoardConnectionAddRequest} data - { fromNodeId, toNodeId, type }
 * @returns {Promise<BoardResponse>}
 * @throws {ApiError}
 */
export const addBoardConnection = async (sessionId, data) => {
  try {
    const response = await apiClient.post(ENDPOINTS.sessions.boardConnections(sessionId), data)
    return response.data
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error)
    }
    throw new ApiError('연결선 추가에 실패했습니다.')
  }
}

/**
 * 보드 삭제 (DELETE /api/sessions/{sessionId}/board)
 * @param {number} sessionId
 * @param {BoardDeleteRequest} data - { nodeIds, connectionIds }
 * @returns {Promise<BoardResponse>}
 * @throws {ApiError}
 */
export const deleteBoard = async (sessionId, data) => {
  try {
    const response = await apiClient.delete(ENDPOINTS.sessions.board(sessionId), { data })
    return response.data
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error)
    }
    throw new ApiError('보드 삭제에 실패했습니다.')
  }
}

// ========================================
// Clues API
// ========================================

/**
 * 단서 목록 조회 (GET /api/sessions/{sessionId}/clues)
 * @param {number} sessionId
 * @returns {Promise<ClueListResponse>}
 * @throws {ApiError}
 */
export const fetchClues = async (sessionId) => {
  try {
    const response = await apiClient.get(ENDPOINTS.sessions.clues(sessionId))
    return response.data
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error)
    }
    throw new ApiError('단서 목록을 불러오는데 실패했습니다.')
  }
}

/**
 * 단서 상세 조회 (GET /api/sessions/{sessionId}/clues/{clueId})
 * @param {number} sessionId
 * @param {number} clueId
 * @returns {Promise<ClueDetailResponse>}
 * @throws {ApiError}
 */
export const fetchClueDetail = async (sessionId, clueId) => {
  try {
    const response = await apiClient.get(ENDPOINTS.sessions.clueDetail(sessionId, clueId))
    return response.data
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error)
    }
    throw new ApiError('단서 상세 정보를 불러오는데 실패했습니다.')
  }
}

/**
 * 단서 획득 (POST /api/sessions/{sessionId}/clues/{clueId})
 * @param {number} sessionId
 * @param {number} clueId
 * @returns {Promise<DiscoveredClueResponse>}
 * @throws {ApiError}
 */
export const discoverClue = async (sessionId, clueId) => {
  try {
    const response = await apiClient.post(ENDPOINTS.sessions.clueDetail(sessionId, clueId))
    return response.data
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error)
    }
    throw new ApiError('단서 획득에 실패했습니다.')
  }
}

// ========================================
// Report API
// ========================================

/**
 * 내 수사보고서 조회 (GET /api/sessions/{sessionId}/report)
 * @param {number} sessionId
 * @returns {Promise<InvestigationReportResponse>}
 * @throws {ApiError}
 */
export const fetchMyReport = async (sessionId) => {
  try {
    const response = await apiClient.get(ENDPOINTS.sessions.report(sessionId))
    return response.data
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error)
    }
    throw new ApiError('수사보고서를 불러오는데 실패했습니다.')
  }
}

/**
 * 타인 수사보고서 조회 (GET /api/sessions/{sessionId}/report/public)
 * @param {number} sessionId
 * @returns {Promise<InvestigationReportResponse>}
 * @throws {ApiError}
 */
export const fetchPublicReport = async (sessionId) => {
  try {
    const response = await apiClient.get(ENDPOINTS.sessions.reportPublic(sessionId))
    return response.data
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error)
    }
    throw new ApiError('수사보고서를 불러오는데 실패했습니다.')
  }
}

export default {
  // Game lifecycle
  startGame,
  fetchResume,
  saveGame,
  endGame,
  moveFloor,
  // Board
  fetchBoard,
  addBoardNode,
  moveBoardNode,
  updateBoardMemo,
  addBoardConnection,
  deleteBoard,
  // Clues
  fetchClues,
  fetchClueDetail,
  discoverClue,
  // Report
  fetchMyReport,
  fetchPublicReport,
}

import { apiClient } from '@/api/client/axios'
import { ENDPOINTS } from '@/api/endpoints'
import { ApiError } from '@/api/errors/ApiError'

/**
 * Board data types
 * @typedef {Object} BoardResponse
 * @property {number} sessionId
 * @property {Array} nodes
 * @property {Array} connections
 * @property {number} redConnectionCount
 */

/**
 * Clue data types
 * @typedef {Object} ClueListResponse
 * @property {number} sessionId
 * @property {number} scenarioId
 * @property {Array} clues
 */

/**
 * Submit validation types
 * @typedef {Object} SubmitValidateResponse
 * @property {number} sessionId
 * @property {boolean} submittable
 * @property {Array<string>} missing
 * @property {Array} requiredRedConnections
 */

/**
 * Submit response types
 * @typedef {Object} SubmitResponse
 * @property {number} sessionId
 * @property {string} status
 * @property {number} attemptsUsed
 * @property {string} completedAt
 * @property {number} finalScore
 * @property {string} rankGrade
 * @property {Object} evaluation
 */

// ========================================
// Board API
// ========================================

/**
 * Fetch board data for a session
 * @param {number} sessionId
 * @returns {Promise<BoardResponse>}
 * @throws {ApiError}
 */
export const fetchBoard = async (sessionId) => {
  try {
    const response = await apiClient.get(ENDPOINTS.sessions.board(sessionId), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
    return response.data
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error)
    }
    throw new ApiError('보드 데이터를 불러오는데 실패했습니다.')
  }
}

/**
 * Update board node position
 * @param {number} sessionId
 * @param {Object} data - { nodeId, x, y }
 * @returns {Promise<BoardResponse>}
 * @throws {ApiError}
 */
export const updateBoardNodePosition = async (sessionId, { nodeId, x, y }) => {
  try {
    const response = await apiClient.patch(
      ENDPOINTS.sessions.boardNodePosition(sessionId),
      { nodeId, x, y },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
    return response.data
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error)
    }
    throw new ApiError('보드 노드 위치 업데이트에 실패했습니다.')
  }
}

// ========================================
// Clues API
// ========================================

/**
 * Fetch clues for a session
 * @param {number} sessionId
 * @returns {Promise<ClueListResponse>}
 * @throws {ApiError}
 */
export const fetchClues = async (sessionId) => {
  try {
    const response = await apiClient.get(ENDPOINTS.sessions.clues(sessionId), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
    return response.data
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error)
    }
    throw new ApiError('단서 데이터를 불러오는데 실패했습니다.')
  }
}

// ========================================
// Suspects API
// ========================================

/**
 * Fetch suspects for a scenario
 * @param {number} scenarioId
 * @returns {Promise<SuspectListResponse>}
 * @throws {ApiError}
 */
export const fetchSuspects = async (scenarioId) => {
  try {
    const response = await apiClient.get(ENDPOINTS.scenarios.suspects(scenarioId), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
    return response.data
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error)
    }
    throw new ApiError('용의자 데이터를 불러오는데 실패했습니다.')
  }
}

// ========================================
// Submit API
// ========================================

/**
 * Validate submit requirements for a session
 * @param {number} sessionId
 * @returns {Promise<SubmitValidateResponse>}
 * @throws {ApiError}
 */
export const validateSubmit = async (sessionId) => {
  try {
    const response = await apiClient.get(ENDPOINTS.sessions.validate(sessionId), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
    return response.data
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error)
    }
    throw new ApiError('제출 검증에 실패했습니다.')
  }
}

/**
 * Submit final answer
 * @param {number} sessionId
 * @param {Object} data - { culpritId, weaponClueId, locationFloor, motive, causeOfDeath }
 * @returns {Promise<SubmitResponse>}
 * @throws {ApiError}
 */
export const submitFinalAnswer = async (sessionId, { culpritId, weaponClueId, locationFloor, motive, causeOfDeath }) => {
  try {
    const response = await apiClient.post(
      ENDPOINTS.sessions.submit(sessionId),
      { culpritId, weaponClueId, locationFloor, motive, causeOfDeath },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
    return response.data
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error)
    }
    throw new ApiError('제출에 실패했습니다.')
  }
}

// ========================================
// Resume API
// ========================================

/**
 * Fetch game resume data
 * @param {number} sessionId
 * @returns {Promise<GameResumeResponse>}
 * @throws {ApiError}
 */
export const fetchResume = async (sessionId) => {
  try {
    const response = await apiClient.get(ENDPOINTS.sessions.resume(sessionId), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
    return response.data
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error)
    }
    throw new ApiError('이어하기 데이터를 불러오는데 실패했습니다.')
  }
}

export default {
  // Board
  fetchBoard,
  updateBoardNodePosition,
  // Clues
  fetchClues,
  // Suspects
  fetchSuspects,
  // Submit
  validateSubmit,
  submitFinalAnswer,
  // Resume
  fetchResume,
}

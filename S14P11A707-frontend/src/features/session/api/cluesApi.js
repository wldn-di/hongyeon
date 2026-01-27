import { apiClient } from '@/api/client/axios'
import { ENDPOINTS } from '@/api/endpoints'
import { ApiError } from '@/api/errors/ApiError'

/**
 * Clue API Module
 * OpenAPI spec 기반으로 작성됨
 */

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

export default {
  fetchClues,
  fetchClueDetail,
  discoverClue,
}

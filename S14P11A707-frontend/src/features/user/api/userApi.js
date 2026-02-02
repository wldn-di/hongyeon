import { apiClient } from '@/api/client/axios'
import { ENDPOINTS } from '@/api/endpoints'
import { ApiError } from '@/api/errors/ApiError'

/**
 * User(Me) API Module
 * OpenAPI spec 기반으로 작성됨
 */

/**
 * 내 시나리오 조회 (GET /api/users/me/scenarios)
 * @param {Object} [params]
 * @param {number} [params.page]
 * @param {number} [params.size]
 * @returns {Promise<ScenarioListResponse>}
 * @throws {ApiError}
 */
export const fetchMyScenarios = async (params = {}) => {
  try {
    const response = await apiClient.get(ENDPOINTS.users.me.scenarios, { params })
    return response.data
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error)
    }
    throw new ApiError('내 시나리오 목록을 불러오는데 실패했습니다.')
  }
}

/**
 * 내 책장 통계 조회 (GET /api/users/me/bookshelf/stats)
 * @returns {Promise<BookshelfStatsResponse>}
 * @throws {ApiError}
 */
export const fetchBookshelfStats = async () => {
  try {
    const response = await apiClient.get(ENDPOINTS.users.me.bookshelfStats)
    return response.data
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error)
    }
    throw new ApiError('책장 통계를 불러오는데 실패했습니다.')
  }
}

/**
 * 내 책장 기록 통합 조회 (GET /api/users/me/bookshelf/sessions)
 * COMPLETED, PLAYING, FAILED 상태의 모든 세션 반환
 * @returns {Promise<BookshelfSessionResponse>}
 * @throws {ApiError}
 */
export const fetchBookshelfSessions = async () => {
  try {
    const response = await apiClient.get(ENDPOINTS.users.me.bookshelfSessions)
    return response.data
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error)
    }
    throw new ApiError('책장 기록을 불러오는데 실패했습니다.')
  }
}

export default {
  fetchMyScenarios,
  fetchBookshelfStats,
  fetchBookshelfSessions,
}

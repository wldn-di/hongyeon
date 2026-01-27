import { apiClient } from '@/api/client/axios'
import { ENDPOINTS } from '@/api/endpoints'
import { ApiError } from '@/api/errors/ApiError'

/**
 * Event Log API Module
 * OpenAPI spec 기반으로 작성됨
 */

/**
 * 수사 로그 조회 (GET /api/sessions/{sessionId}/logs)
 * @param {number} sessionId
 * @returns {Promise<EventLogListResponse>}
 * @throws {ApiError}
 */
export const fetchEventLogs = async (sessionId) => {
  try {
    const response = await apiClient.get(ENDPOINTS.sessions.logs(sessionId))
    return response.data
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error)
    }
    throw new ApiError('수사 로그를 불러오는데 실패했습니다.')
  }
}

export default {
  fetchEventLogs,
}

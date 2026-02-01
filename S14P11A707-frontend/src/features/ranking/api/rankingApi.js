import { apiClient } from '@/api/client/axios'
import { ENDPOINTS } from '@/api/endpoints'
import { ApiError } from '@/api/errors/ApiError'

/**
 * 전체 랭킹 조회
 * @param {string} type - 랭킹 타입 ('score' | 'clears' | 'time')
 * @returns {Promise<GlobalRankingResponse>}
 * @throws {ApiError}
 */
export const fetchGlobalRankings = async (type = 'score') => {
  try {
    const response = await apiClient.get(ENDPOINTS.rankings, {
      params: { type },
      headers: {
        'Content-Type': 'application/json',
      },
    })
    return response.data
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error)
    }
    throw new ApiError('랭킹 데이터를 불러오는데 실패했습니다.')
  }
}

/**
 * 내 랭킹 조회
 * @returns {Promise<GlobalRankingResponse>}
 * @throws {ApiError}
 */
export const fetchMyRankings = async () => {
  try {
    const response = await apiClient.get(ENDPOINTS.myRankings, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
    return response.data
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error)
    }
    throw new ApiError('내 랭킹 데이터를 불러오는데 실패했습니다.')
  }
}

export default {
  fetchGlobalRankings,
  fetchMyRankings,
}

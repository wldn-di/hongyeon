import { apiClient } from '@/api/client/axios'
import { ENDPOINTS } from '@/api/endpoints'
import { ApiError } from '@/api/errors/ApiError'

/**
 * 전체 랭킹 조회 (Top 10)
 * @param {string} type - 랭킹 타입 ('score' | 'clears' | 'time')
 * @returns {Promise<GlobalRankingResponse>}
 * @throws {ApiError}
 */
export const fetchGlobalRankings = async (type = 'score') => {
  try {
    const response = await apiClient.get(ENDPOINTS.rankings.top10, {
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
 * 내 랭킹 조회 (로그인 필수)
 * @param {string} type - 랭킹 타입 ('score' | 'clears' | 'time')
 * @returns {Promise<MyRankingResponse>}
 * @throws {ApiError}
 */
export const fetchMyRankings = async (type = 'score') => {
  try {
    const response = await apiClient.get(ENDPOINTS.rankings.me, {
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
    throw new ApiError('내 랭킹 데이터를 불러오는데 실패했습니다.')
  }
}

export default {
  fetchGlobalRankings,
  fetchMyRankings,
}

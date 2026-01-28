import { apiClient } from '@/api/client/axios'
import { ENDPOINTS } from '@/api/endpoints'
import { ApiError } from '@/api/errors/ApiError'

/**
 * Review API Module
 * OpenAPI spec 기반으로 작성됨
 */

/**
 * 리뷰 목록 조회 (GET /api/reviews/{scenarioId}/reviews)
 * @param {number} scenarioId
 * @param {number} page - 페이지 번호 (default: 0)
 * @param {number} size - 페이지 크기 (default: 10)
 * @returns {Promise<ReviewListResponse>}
 * @throws {ApiError}
 */
export const fetchReviews = async (scenarioId, page = 0, size = 10) => {
  try {
    const response = await apiClient.get(ENDPOINTS.reviews.list(scenarioId), {
      params: { page, size },
    })
    return response.data
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error)
    }
    throw new ApiError('리뷰 목록을 불러오는데 실패했습니다.')
  }
}

/**
 * 리뷰 작성 (POST /api/reviews/{scenarioId}/reviews)
 * @param {number} scenarioId
 * @param {ReviewCreateRequest} data - { rating, difficulty, content, isSpoiler }
 * @returns {Promise<ReviewResponse>}
 * @throws {ApiError}
 */
export const createReview = async (scenarioId, data) => {
  try {
    const response = await apiClient.post(ENDPOINTS.reviews.create(scenarioId), data)
    return response.data
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error)
    }
    throw new ApiError('리뷰 작성에 실패했습니다.')
  }
}

/**
 * 리뷰 수정 (PATCH /api/reviews/{reviewId})
 * @param {number} reviewId
 * @param {ReviewUpdateRequest} data - { content }
 * @returns {Promise<ReviewResponse>}
 * @throws {ApiError}
 */
export const updateReview = async (reviewId, data) => {
  try {
    const response = await apiClient.patch(ENDPOINTS.reviews.update(reviewId), data)
    return response.data
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error)
    }
    throw new ApiError('리뷰 수정에 실패했습니다.')
  }
}

/**
 * 리뷰 삭제 (DELETE /api/reviews/{reviewId})
 * @param {number} reviewId
 * @returns {Promise<ReviewResponse>}
 * @throws {ApiError}
 */
export const deleteReview = async (reviewId) => {
  try {
    const response = await apiClient.delete(ENDPOINTS.reviews.delete(reviewId))
    return response.data
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error)
    }
    throw new ApiError('리뷰 삭제에 실패했습니다.')
  }
}

export default {
  fetchReviews,
  createReview,
  updateReview,
  deleteReview,
}

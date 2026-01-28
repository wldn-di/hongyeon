/**
 * Review Data Mappers
 * OpenAPI spec 기반 DTO → Frontend Shape 변환
 */

/**
 * ReviewListResponse → 리뷰 배열
 * @param {ReviewListResponse} response
 * @returns {Object} { content: Array, totalPages, totalElements, currentPage }
 */
export const mapReviewListResponse = (response) => {
  if (!response) return { content: [], totalPages: 0, totalElements: 0, currentPage: 0 }

  return {
    content: response.content?.map(mapReviewItem) || [],
    totalPages: response.totalPages || 0,
    totalElements: response.totalElements || 0,
    currentPage: response.currentPage || 0,
  }
}

/**
 * ReviewItem/ReviewResponse → Frontend Review Shape
 * @param {Object} item - backend Item/ReviewResponse
 * @returns {Object} frontend review shape
 */
export const mapReviewItem = (item) => {
  return {
    id: item.reviewId || item.id,
    scenarioId: item.scenarioId,
    userId: item.userId,
    nickname: item.nickname || '익명',
    rating: item.rating,
    difficulty: item.difficulty,
    content: item.content || '',
    isSpoiler: item.isSpoiler || false,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    // 삭제된 리뷰 체크
    isDeleted: item.isDeleted || false,
  }
}

/**
 * ReviewResponse → 단일 리뷰
 * @param {ReviewResponse} response
 * @returns {Object} frontend review shape
 */
export const mapReviewResponse = (response) => {
  if (!response) return null
  return mapReviewItem(response)
}

/**
 * 프론트엔드 리뷰 작성 요청 → Backend Request DTO
 * @param {Object} data - frontend review create data
 * @returns {ReviewCreateRequest} backend request shape
 */
export const mapReviewCreateRequest = (data) => {
  return {
    rating: data.rating,
    difficulty: data.difficulty,
    content: data.content || '',
    isSpoiler: data.isSpoiler || false,
  }
}

/**
 * 프론트엔드 리뷰 수정 요청 → Backend Request DTO
 * @param {Object} data - frontend review update data
 * @returns {ReviewUpdateRequest} backend request shape
 */
export const mapReviewUpdateRequest = (data) => {
  return {
    content: data.content || '',
  }
}

/**
 * 별점 표시용 문자열 변환
 * @param {number} rating - 1~5
 * @returns {string} 별표시 (예: "★★★★☆")
 */
export const mapRatingStars = (rating) => {
  const fullStars = Math.floor(rating)
  const hasHalf = rating % 1 >= 0.5
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0)

  return (
    '★'.repeat(fullStars) +
    (hasHalf ? '½' : '') +
    '☆'.repeat(emptyStars)
  )
}

export default {
  mapReviewListResponse,
  mapReviewItem,
  mapReviewResponse,
  mapReviewCreateRequest,
  mapReviewUpdateRequest,
  mapRatingStars,
}

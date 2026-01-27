/**
 * API 에러 커스텀 클래스
 */
export class ApiError extends Error {
  /**
   * @param {string} message - 에러 메시지
   * @param {string} code - 에러 코드
   * @param {number} status - HTTP 상태 코드
   * @param {string} path - 요청 경로
   */
  constructor(message, code = null, status = null, path = null) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.path = path
  }

  /**
   * Axios 에러 응답으로부터 ApiError 인스턴스 생성
   * @param {Object} errorResponse - Axios 에러 응답
   * @returns {ApiError}
   */
  static fromAxiosError(errorResponse) {
    const { data } = errorResponse.response || {}
    return new ApiError(
      data?.message || 'API 요청 실패',
      data?.code || null,
      errorResponse.response?.status || null,
      data?.path || null
    )
  }
}

export default ApiError

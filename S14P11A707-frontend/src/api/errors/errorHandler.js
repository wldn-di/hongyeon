import { ApiError } from './ApiError'

/**
 * 에러 메시지 추출
 * @param {Error|ApiError} error - 에러 객체
 * @returns {string} 에러 메시지
 */
export const getErrorMessage = (error) => {
  // ApiError 인스턴스인 경우
  if (error instanceof ApiError) {
    return error.message
  }

  // Axios 에러 응답인 경우
  if (error.response?.data?.message) {
    return error.response.data.message
  }

  // 일반 Error 인스턴스인 경우
  if (error.message) {
    return error.message
  }

  return '알 수 없는 오류가 발생했습니다.'
}

/**
 * 에러 로깅
 * @param {Error|ApiError} error - 에러 객체
 * @param {string} context - 에러 컨텍스트
 */
export const logError = (error, context = 'API') => {
  console.error(`[${context}]`, error)

  if (error instanceof ApiError) {
    console.error(`[${context}] Code: ${error.code}, Status: ${error.status}, Path: ${error.path}`)
  }
}

export default { getErrorMessage, logError }

/**
 * 정규화된 랭킹 항목 타입
 * @typedef {Object} NormalizedRanking
 * @property {number|string} userId - 사용자 ID
 * @property {string} username - 사용자 이름
 * @property {number} rank - 순위
 * @property {number} value - 랭킹 값 (타입에 따라 점수/클리어수/시간)
 * @property {string} formattedValue - 포맷된 값
 */

/**
 * 시간(초)을 포맷된 문자열로 변환
 * @param {number} seconds - 초
 * @returns {string}
 */
const formatPlayTime = (seconds) => {
  if (!seconds || seconds <= 0) return '0분'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}시간 ${minutes}분`
  }
  return `${minutes}분`
}

/**
 * 값을 타입에 맞게 포맷
 * @param {number} value - 값
 * @param {string} type - 랭킹 타입
 * @returns {string}
 */
const formatValue = (value, type) => {
  if (!Number.isFinite(value)) return '-'

  switch (type) {
    case 'score':
      return value.toLocaleString() + '점'
    case 'clears':
      return value.toLocaleString() + '회'
    case 'time':
      return formatPlayTime(value)
    default:
      return value.toLocaleString()
  }
}

/**
 * API 응답을 내부 데이터 형식으로 변환
 * @param {RankEntry} entry - API 랭킹 항목
 * @param {number} fallbackIndex - 폴백 인덱스
 * @param {string} type - 랭킹 타입
 * @returns {NormalizedRanking}
 */
export const normalizeRankingEntry = (entry, fallbackIndex, type = 'score') => {
  const rankNum = Number(entry?.rank)
  const userIdNum = Number(entry?.userId)
  const valueNum = Number(entry?.value)

  const safeRank = Number.isFinite(rankNum) ? rankNum : fallbackIndex + 1
  const safeValue = Number.isFinite(valueNum) ? valueNum : 0

  return {
    userId: Number.isFinite(userIdNum) ? userIdNum : `unknown-${fallbackIndex}`,
    username: entry?.nickname || '알 수 없음',
    rank: safeRank,
    value: safeValue,
    formattedValue: formatValue(safeValue, type),
  }
}

/**
 * 전체 랭킹 응답 변환
 * @param {GlobalRankingResponse} response - API 응답
 * @param {string} type - 랭킹 타입
 * @returns {{ rankingData: NormalizedRanking[], myRanking: NormalizedRanking | null }}
 */
export const normalizeRankingResponse = (response, type = 'score') => {
  if (!response || typeof response !== 'object') {
    console.error('Invalid ranking response:', response)
    return {
      rankingData: [],
      myRanking: null,
    }
  }

  // 응답에서 타입 가져오기 (없으면 파라미터 사용)
  const rankingType = response?.type || type

  const top10 = Array.isArray(response?.top10) ? response.top10.slice(0, 10) : []
  const validatedData = top10.map((item, index) => normalizeRankingEntry(item, index, rankingType))
  const validatedMyRank = response?.myRank
    ? normalizeRankingEntry(response.myRank, validatedData.length, rankingType)
    : null

  return {
    rankingData: validatedData,
    myRanking: validatedMyRank,
  }
}

export default {
  normalizeRankingEntry,
  normalizeRankingResponse,
}
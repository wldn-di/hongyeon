/**
 * 정규화된 랭킹 항목 타입
 * @typedef {Object} NormalizedRanking
 * @property {number|string} userId - 사용자 ID
 * @property {string} username - 사용자 이름
 * @property {number} rank - 순위
 * @property {number} totalScore - 총 점수
 * @property {number} solvedCases - 해결한 사건 수
 * @property {string} avgClearTime - 평균 클리어 시간 (포맷된 문자열)
 * @property {number} avgClearTimeSeconds - 평균 클리어 시간 (초)
 * @property {number} perfectClears - 완벽한 클리어 횟수
 * @property {string|null} lastPlayedAt - 마지막 플레이 시간
 */

/**
 * API 랭킹 항목 타입
 * @typedef {Object} RankEntry
 * @property {number} rank - 순위
 * @property {number} userId - 사용자 ID
 * @property {string} nickname - 닉네임
 * @property {number} value - 점수
 */

/**
 * API 랭킹 응답 타입
 * @typedef {Object} GlobalRankingResponse
 * @property {string} type - 랭킹 타입
 * @property {RankEntry[]} top10 - Top 10 랭킹
 * @property {RankEntry|null} myRank - 내 랭킹
 */

/**
 * API 응답을 내부 데이터 형식으로 변환
 * @param {RankEntry} entry - API 랭킹 항목
 * @param {number} fallbackIndex - 폴백 인덱스
 * @returns {NormalizedRanking}
 */
export const normalizeRankingEntry = (entry, fallbackIndex) => {
  const rankNum = Number(entry?.rank)
  const userIdNum = Number(entry?.userId)
  const valueNum = Number(entry?.value)

  const safeRank = Number.isFinite(rankNum) ? rankNum : fallbackIndex + 1

  return {
    userId: Number.isFinite(userIdNum) ? userIdNum : `unknown-${fallbackIndex}`,
    username: entry?.nickname || '알 수 없음',
    rank: safeRank,
    totalScore: Number.isFinite(valueNum) ? valueNum : 0,
    solvedCases: 0,
    avgClearTime: '-',
    avgClearTimeSeconds: 0,
    perfectClears: 0,
    lastPlayedAt: null,
  }
}

/**
 * 전체 랭킹 응답 변환
 * @param {GlobalRankingResponse} response - API 응답
 * @returns {{ rankingData: NormalizedRanking[], myRanking: NormalizedRanking | null }}
 */
export const normalizeRankingResponse = (response) => {
  if (!response) {
    console.error('Invalid ranking response:', response)
    return { rankingData: [], myRanking: null }
  }

  // 응답이 배열인 경우도 허용 (top10만 내려주는 케이스)
  const top10Source = Array.isArray(response)
    ? response
    : Array.isArray(response?.top10)
      ? response.top10
      : Array.isArray(response?.rankings)
        ? response.rankings
        : Array.isArray(response?.content)
          ? response.content
          : []

  const top10 = top10Source.slice(0, 10)
  const validatedData = top10.map((item, index) => normalizeRankingEntry(item, index))
  const myRankSource = response?.myRank || response?.myRanking || null
  const validatedMyRank = myRankSource ? normalizeRankingEntry(myRankSource, validatedData.length) : null

  return {
    rankingData: validatedData,
    myRanking: validatedMyRank,
  }
}

/**
 * 내 랭킹 응답 변환 (/api/rankings/me)
 * @param {any} response
 * @returns {NormalizedRanking | null}
 */
export const normalizeMyRankingResponse = (response) => {
  if (!response) return null

  const entry =
    response?.myRank ||
    response?.myRanking ||
    // 단일 RankEntry를 바로 반환하는 케이스
    (response?.rank !== undefined && response?.userId !== undefined ? response : null)

  if (!entry) return null
  return normalizeRankingEntry(entry, 0)
}

export default {
  normalizeRankingEntry,
  normalizeRankingResponse,
  normalizeMyRankingResponse,
}

/**
 * 정규화된 랭킹 항목 타입
 * @typedef {Object} NormalizedRanking
 * @property {number|string} userId
 * @property {string} username
 * @property {number} rank
 * @property {'score'|'clears'|'time'} type
 * @property {number} metricValue        - value 원본 숫자
 * @property {string} metricLabel        - UI 라벨 (점수/클리어/시간)
 * @property {string} metricDisplay      - UI 표시 문자열
 *
 * // 기존 호환 필드(현재 UI가 이걸 쓸 수도 있어서 유지)
 * @property {number} totalScore
 * @property {number} solvedCases
 * @property {string} avgClearTime
 * @property {number} avgClearTimeSeconds
 * @property {number} perfectClears
 * @property {string|null} lastPlayedAt
 */

const formatSeconds = (sec) => {
  const s = Number(sec);
  if (!Number.isFinite(s) || s < 0) return "-";
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}분 ${r}초`;
};

/**
 * API 랭킹 항목 타입
 * @typedef {Object} RankEntry
 * @property {number} rank
 * @property {number} userId
 * @property {string} nickname
 * @property {number} value
 */

/**
 * API 응답을 내부 데이터 형식으로 변환
 * @param {RankEntry} entry
 * @param {number} fallbackIndex
 * @param {'score'|'clears'|'time'} type
 * @returns {NormalizedRanking}
 */
export const normalizeRankingEntry = (entry, fallbackIndex, type = "score") => {
  const rankNum = Number(entry?.rank);
  const userIdNum = Number(entry?.userId);
  const valueNum = Number(entry?.value);

  const safeRank = Number.isFinite(rankNum) ? rankNum : fallbackIndex + 1;
  const safeValue = Number.isFinite(valueNum) ? valueNum : 0;

  const metricLabel =
    type === "time" ? "플레이 시간" : type === "clears" ? "클리어" : "점수";

  const metricDisplay =
    type === "time"
      ? formatSeconds(safeValue)
      : type === "clears"
        ? `${safeValue}회`
        : `${safeValue.toLocaleString()}점`;

  // 기존 필드에 매핑도 같이 해줌(현재 UI가 totalScore만 쓰는 경우 대비)
  const totalScore = type === "score" ? safeValue : 0;
  const solvedCases = type === "clears" ? safeValue : 0;
  const avgClearTimeSeconds = type === "time" ? safeValue : 0;
  const avgClearTime = type === "time" ? formatSeconds(safeValue) : "-";

  return {
    userId: Number.isFinite(userIdNum) ? userIdNum : `unknown-${fallbackIndex}`,
    username: entry?.nickname || "알 수 없음",
    rank: safeRank,

    type,
    metricValue: safeValue,
    metricLabel,
    metricDisplay,

    totalScore,
    solvedCases,
    avgClearTime,
    avgClearTimeSeconds,
    perfectClears: 0,
    lastPlayedAt: null,
  };
};

/**
 * 전체 랭킹 응답 변환 (/api/rankings)
 * @param {any} response
 * @returns {{ rankingData: NormalizedRanking[], myRanking: NormalizedRanking | null }}
 */
export const normalizeRankingResponse = (response) => {
  if (!response) return { rankingData: [], myRanking: null };

  const type = response?.type || "score";

  const top10Source = Array.isArray(response?.top10) ? response.top10 : [];
  const top10 = top10Source.slice(0, 10);
  const rankingData = top10.map((item, index) =>
    normalizeRankingEntry(item, index, type),
  );

  // 백엔드 GlobalRankingResponse에 myRank가 있든 없든 안전 처리
  const myRankSource = response?.myRank || response?.myRanking || null;
  const myRanking = myRankSource
    ? normalizeRankingEntry(myRankSource, rankingData.length, type)
    : null;

  return { rankingData, myRanking };
};

/**
 * 내 랭킹 응답 변환 (/api/rankings/me)
 * @param {any} response
 * @returns {NormalizedRanking | null}
 */
export const normalizeMyRankingResponse = (response) => {
  if (!response) return null;

  const type = response?.type || "score";
  const entry =
    response?.myRank ||
    response?.myRanking ||
    (response?.rank !== undefined && response?.userId !== undefined
      ? response
      : null);

  if (!entry) return null;
  return normalizeRankingEntry(entry, 0, type);
};

export default {
  normalizeRankingEntry,
  normalizeRankingResponse,
  normalizeMyRankingResponse,
};

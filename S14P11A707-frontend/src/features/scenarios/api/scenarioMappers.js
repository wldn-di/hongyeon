/**
 * Scenario Data Mappers
 * OpenAPI spec 기반 DTO → Frontend Shape 변환
 */

/**
 * Backend generation status normalize helper
 * - Backend: GENERATING | COMPLETED | FAILED
 * - Unknown/empty values are treated as COMPLETED (legacy data / backward compatibility)
 * @param {any} raw
 * @returns {'GENERATING'|'COMPLETED'|'FAILED'}
 */
export const normalizeStatus = (raw) => {
  const value = String(raw ?? '').trim().toUpperCase()
  if (value === 'GENERATING' || value === 'COMPLETED' || value === 'FAILED') return value
  return 'COMPLETED'
}

/**
 * Public/All lists visibility rule
 * @param {Object} scenario
 * @returns {boolean}
 */
export const isVisibleInAll = (scenario) => normalizeStatus(scenario?.status) === 'COMPLETED'

/**
 * Mine list visibility rule
 * @param {Object} scenario
 * @returns {boolean}
 */
export const isVisibleInMine = (scenario) => {
  const status = normalizeStatus(scenario?.status)
  return status === 'COMPLETED' || status === 'GENERATING'
}

/**
 * ScenarioListResponse → 시나리오 배열
 * @param {ScenarioListResponse} response
 * @returns {Array} 시나리오 배열
 */
export const mapScenarioListResponse = (response) => {
  if (!response?.content) return []
  return response.content.map(mapScenarioItem)
}

/**
 * ScenarioListResponse → 전체 응답 객체 (content 포함)
 * @param {ScenarioListResponse} response
 * @returns {Object} 전체 응답 객체
 */
export const mapScenarioListResponseFull = (response) => {
  if (!response) {
    return {
      content: [],
      totalPages: 0,
      totalElements: 0,
      currentPage: 0,
    }
  }

  // 배열 형태 응답도 허용 (예: /api/users/me/scenarios 가 배열을 반환하는 경우)
  if (Array.isArray(response)) {
    return {
      content: response.map(mapScenarioItem),
      totalPages: 1,
      totalElements: response.length,
      currentPage: 0,
    }
  }

  const currentPage =
    Number.isFinite(Number(response.currentPage))
      ? Number(response.currentPage)
      : Number.isFinite(Number(response.number))
        ? Number(response.number)
        : 0

  return {
    content: response.content?.map(mapScenarioItem) || [],
    totalPages: response.totalPages || 0,
    totalElements: response.totalElements || 0,
    currentPage,
  }
}

/**
 * ScenarioItem → Frontend Scenario Shape
 * @param {Object} item - backend ScenarioItem
 * @returns {Object} frontend scenario shape
 */
export const mapScenarioItem = (item) => {
  return {
    id: item.id || item.scenarioId || item.reviewId, // fallback (일부 응답은 scenarioId 사용)
    title: item.title,
    synopsis: item.synopsis || item.description || '',
    genre: item.genre || '미정',
    thumbnail: item.thumbnailUrl || `/images/img${(item.id || 1) % 5 + 1}.png`,
    playCount: item.playCount || 0,
    rating: item.avgRating ? Math.round(item.avgRating * 100) : 0, // 4.5 → 450
    difficulty: mapDifficulty(item.avgDifficulty),
    avgRating: item.avgRating || 0,
    avgDifficulty: item.avgDifficulty || 0,
    estimatedTime: item.estimatedTime || 30,
    status: item.status || null,
  }
}

/**
 * 숫자 난이도 → 문자열 변환
 * @param {number} difficulty - 1~5
 * @returns {string} 'easy' | 'medium' | 'hard'
 */
export const mapDifficulty = (difficulty) => {
  const num = Number(difficulty)
  if (!Number.isFinite(num)) return 'medium'
  if (num <= 2) return 'easy'
  if (num <= 4) return 'medium'
  return 'hard'
}

/**
 * ScenarioDetailResponse → Frontend Scenario Detail Shape
 * @param {ScenarioDetailResponse} response
 * @returns {Object} frontend scenario detail shape
 */
export const mapScenarioDetailResponse = (response) => {
  if (!response) return null

  // narration 데이터 추출 (storyConfigJson 또는 직접 필드에서)
  const narration = response.narration || response.storyConfigJson?.narration || {}

  return {
    id: response.id,
    title: response.title,
    synopsis: response.synopsis || '',
    synopsisDetail: response.synopsisDetail || response.synopsis || '',
    genre: response.genre || '미정',
    thumbnail: response.thumbnailUrl || `/images/img${response.id % 5 + 1}.png`,
    playCount: response.playCount || 0,
    avgRating: response.avgRating || 0,
    avgDifficulty: response.avgDifficulty || 0,
    difficulty: mapDifficulty(response.avgDifficulty),
    // UI 호환성 필드
    rating: response.avgRating ? Math.round(response.avgRating * 100) : 0,
    estimatedTime: response.estimatedTime || 30, // 기본값 30분
    // 나레이션 데이터 (에필로그, 범인 독백 등)
    narration_epilogue: response.narration_epilogue || narration.epilogue || null,
    culprit_monologue: response.culprit_monologue || narration.culprit_monologue || null,
    unsolved_monologue: response.unsolved_monologue || narration.unsolved_monologue || null,
    status: response.status || null,
    // 중첩 데이터 매핑
    victim: response.victim ? mapVictim(response.victim) : null,
    suspects: response.suspects?.map(mapSuspect) || [],
    rankings: response.scenarioRankings?.map(mapScenarioRanking) || [],
  }
}

/**
 * Victim DTO → Frontend Victim Shape
 * @param {Object} victim - backend Victim
 * @returns {Object} frontend victim shape
 */
export const mapVictim = (victim) => {
  if (!victim) return null
  return {
    id: victim.victimId,
    name: victim.name,
    age: victim.age,
    gender: victim.gender,
    occupation: victim.occupation,
    discoveryLocation: victim.discoveryLocation,
    estimatedDeathTime: victim.estimatedDeathTime,
    causeOfDeath: victim.causeOfDeath,
    background: victim.background,
    portraitUrl: victim.portraitUrl || '/images/victim.png',
    image: victim.portraitUrl || '/images/victim.png', // UI compatibility alias
  }
}

/**
 * Suspect DTO → Frontend Suspect Shape
 * @param {Object} suspect - backend Suspect
 * @returns {Object} frontend suspect shape
 */
export const mapSuspect = (suspect) => {
  if (!suspect) return null
  return {
    id: suspect.suspectId,
    name: suspect.name,
    age: suspect.age,
    gender: suspect.gender,
    occupation: suspect.occupation,
    role: suspect.occupation, // UI compatibility alias
    oneLiner: suspect.oneLiner,
    portraitUrl: suspect.portraitUrl || `/images/suspects/suspect${suspect.suspectId}.png`,
    image: suspect.portraitUrl || `/images/suspects/suspect${suspect.suspectId}.png`, // UI compatibility alias
    displayOrder: suspect.displayOrder || 0,
  }
}

/**
 * SuspectListResponse → 용의자 배열
 * @param {SuspectListResponse} response
 * @returns {Array} 용의자 배열
 */
export const mapSuspectListResponse = (response) => {
  if (!response?.suspects) return []
  return response.suspects.map(mapSuspect)
}

/**
 * Room DTO → Frontend Room Shape
 * @param {Object} room - backend Room
 * @returns {Object} frontend room shape
 */
export const mapRoom = (room) => {
  if (!room) return null
  return {
    id: room.roomId,
    floorNumber: room.floorNumber,
    roomType: room.roomType,
    name: room.roomName,
    description: room.description,
    assistantComment: room.assistantComment,
    objects: room.objects || null,
    // 프론트엔드에서 사용하는 추가 필드
    unlocked: true, // 기본값 - 필요시 game state에서 계산
    image: `/images/rooms/room-${room.roomId}.png`, // 기본 이미지 경로
  }
}

/**
 * RoomListResponse → 방 배열
 * @param {RoomListResponse} response
 * @returns {Array} 방 배열
 */
export const mapRoomListResponse = (response) => {
  // 응답이 직접 배열인 경우
  if (Array.isArray(response)) {
    return response.map(mapRoom).filter(Boolean)
  }
  // 응답이 객체이고 rooms 필드가 있는 경우
  if (response?.rooms) {
    return response.rooms.map(mapRoom).filter(Boolean)
  }
  // 응답이 객체이고 content 필드가 있는 경우 (페이징 응답)
  if (response?.content) {
    return response.content.map(mapRoom).filter(Boolean)
  }
  return []
}

/**
 * VictimResponse → 피해자 정보
 * @param {VictimResponse} response
 * @returns {Object} 피해자 정보
 */
export const mapVictimResponse = (response) => {
  if (!response?.victim) return null
  return mapVictim(response.victim)
}

/**
 * ScenarioRanking → Frontend Ranking Shape
 * @param {Object} ranking - backend ScenarioRanking
 * @returns {Object} frontend ranking shape
 */
export const mapScenarioRanking = (ranking) => {
  if (!ranking) return null
  return {
    rank: ranking.rank,
    userId: ranking.userId,
    nickname: ranking.nickname,
    score: ranking.score,
    clearTime: ranking.clearTime,
    rankGrade: ranking.rankGrade,
  }
}

/**
 * ScenarioRankingResponse → 시나리오 랭킹
 * @param {ScenarioRankingResponse} response
 * @returns {Object} 시나리오 랭킹 정보
 */
export const mapScenarioRankingResponse = (response) => {
  if (!response) return null
  return {
    scenarioId: response.scenarioId,
    hasUserCleared: response.hasUserCleared || false,
    rankings: response.rankings?.map(mapScenarioRanking) || [],
  }
}

/**
 * ScenarioCreateResponse → 시나리오 생성 응답
 * @param {ScenarioCreateResponse} response
 * @returns {Object} 시나리오 생성 응답
 */
export const mapScenarioCreateResponse = (response) => {
  if (!response) return null
  return {
    scenarioId: response.scenarioId,
    status: response.status,
    estimatedTime: response.estimatedTime,
    errorMessage: response.errorMessage,
    originalRequest: response.originalRequest ? {
      title: response.originalRequest.title,
      synopsis: response.originalRequest.synopsis,
      genre: response.originalRequest.genre,
      suspectCount: response.originalRequest.suspectCount,
    } : null,
  }
}

/**
 * ScenarioStatusResponse → 시나리오 생성 상태
 * @param {ScenarioStatusResponse} response
 * @returns {Object} 시나리오 생성 상태
 */
export const mapScenarioStatusResponse = (response) => {
  if (!response) return null
  return {
    scenarioId: response.scenarioId,
    status: response.status,
    progress: response.progress || 0,
    message: response.message || '',
  }
}

export default {
  mapScenarioListResponse,
  mapScenarioListResponseFull,
  mapScenarioItem,
  mapScenarioDetailResponse,
  mapSuspectListResponse,
  mapRoomListResponse,
  mapVictimResponse,
  mapScenarioRankingResponse,
  mapScenarioCreateResponse,
  mapScenarioStatusResponse,
  mapVictim,
  mapSuspect,
  mapRoom,
  mapScenarioRanking,
  mapDifficulty,
}

/**
 * Session API mappers
 * Transforms backend API responses into UI-friendly models
 */

/**
 * Node type enum
 */
export const NodeType = {
  SUSPECT: 'SUSPECT',
  CLUE: 'CLUE',
  MEMO: 'MEMO',
}

/**
 * Connection type enum (백엔드 값 기준)
 */
export const ConnectionType = {
  RED: 'RED',
  YELLOW: 'YELLOW',
}

const clampFloor = (value, fallback = 1) => {
  const num = Number(value)
  if (!Number.isFinite(num)) return fallback
  return Math.min(6, Math.max(1, Math.trunc(num)))
}

// ========================================
// Bookshelf Mappers
// ========================================

/**
 * Map bookshelf session item from API response
 * @param {Object} item - API bookshelf item (Item type)
 * @returns {Object} Mapped bookshelf item
 */
export const mapBookshelfItem = (item) => {
  if (!item) return null

  return {
    // 세션/시나리오 ID
    sessionId: item.sessionId,
    scenarioId: item.scenarioId,

    // 시나리오 정보 (API 필드명 그대로 사용)
    title: item.title || '알 수 없는 시나리오',
    synopsis: item.synopsis || '',
    thumbnail: item.thumbnailUrl || null,

    // 세션 상태
    status: item.status || 'UNKNOWN',
    playTime: item.playTime || 0,
    rankGrade: item.rankGrade || null,
    hasReport: item.hasReport || false,

    // 시간 정보
    lastSavedAt: item.lastSavedAt || null,
    expiresAt: item.expiresAt || null,

    // 하위 호환성을 위한 필드 (기존 코드에서 사용할 수 있음)
    id: item.sessionId,
    scenarioTitle: item.title || '알 수 없는 시나리오',
  }
}


/**
 * Map bookshelf stats response from API
 * @param {Object} response - API BookshelfStatsResponse
 * @returns {Object} Mapped bookshelf stats
 */
export const mapBookshelfStatsResponse = (response) => {
  if (!response) {
    return {
      totalAttempts: 0,
      totalClears: 0,
      clearRate: 0,
      sRankCount: 0,
    }
  }

  return {
    totalAttempts: response.totalAttempts || 0,
    totalClears: response.totalClears || 0,
    clearRate: response.clearRate || 0,
    sRankCount: response.sRankCount || 0,
  }
}

/**
 * Map bookshelf session response from API
 * @param {Object} response - API BookshelfSessionResponse
 * @returns {Object} Mapped bookshelf session data
 */
export const mapBookshelfSessionResponse = (response) => {
  if (!response) {
    return {
      content: [],
      totalPages: 0,
      totalElements: 0,
      currentPage: 0,
    }
  }

  return {
    content: Array.isArray(response.content)
      ? response.content.map(mapBookshelfItem).filter(Boolean)
      : [],
    totalPages: response.totalPages || 0,
    totalElements: response.totalElements || 0,
    currentPage: response.currentPage || 0,
  }
}

// ========================================
// Board Mappers
// ========================================

/**
 * Normalize board node from API response
 * @param {Object} node - API board node
 * @returns {Object} Normalized board node
 */
export const normalizeBoardNode = (node) => {
  if (!node || typeof node !== 'object') {
    return null
  }

  return {
    id: node.nodeId,
    type: node.type,
    targetId: node.targetId,
    memoContent: node.memoContent || '',
    x: node.x || 0,
    y: node.y || 0,
  }
}

/**
 * Normalize board connection from API response
 * @param {Object} connection - API board connection
 * @returns {Object} Normalized board connection
 */
export const normalizeBoardConnection = (connection) => {
  if (!connection || typeof connection !== 'object') {
    return null
  }

  return {
    id: connection.connectionId,
    from: connection.fromNodeId,
    to: connection.toNodeId,
    type: connection.type,
  }
}

/**
 * Normalize board response from API
 * @param {Object} response - API board response
 * @returns {Object} Normalized board data
 */
export const normalizeBoardResponse = (response) => {
  if (!response || typeof response !== 'object') {
    console.error('Invalid board response:', response)
    return {
      sessionId: null,
      nodes: [],
      connections: [],
      redConnectionCount: 0,
    }
  }

  const nodes = Array.isArray(response.nodes)
    ? response.nodes.map(normalizeBoardNode).filter(Boolean)
    : []

  const connections = Array.isArray(response.connections)
    ? response.connections.map(normalizeBoardConnection).filter(Boolean)
    : []

  return {
    sessionId: response.sessionId || null,
    nodes,
    connections,
    redConnectionCount: response.redConnectionCount || 0,
  }
}

// ========================================
// Clue Mappers
// ========================================

/**
 * Normalize clue from API response
 * @param {Object} clue - API clue
 * @returns {Object} Normalized clue
 */
export const normalizeClue = (clue) => {
  if (!clue || typeof clue !== 'object') {
    return null
  }

  return {
    id: clue.clueId,
    roomId: clue.roomId,
    floorNumber: clampFloor(clue.floorNumber, 1),
    name: clue.name || '',
    importance: clue.importance || '',
    description: clue.description || '',
    detailImageUrl: clue.detailImageUrl || '',
    assistantComment: clue.assistantComment || '',
    transform: clue.transform || null,
    discovered: clue.discovered || false,
    discoveredAt: clue.discoveredAt || null,
  }
}

/**
 * Normalize clue list response from API
 * @param {Object} response - API clue list response
 * @returns {Object} Normalized clue list data
 */
export const normalizeClueListResponse = (response) => {
  // 응답이 직접 배열인 경우
  if (Array.isArray(response)) {
    return {
      sessionId: null,
      scenarioId: null,
      clues: response.map(normalizeClue).filter(Boolean),
    }
  }

  if (!response || typeof response !== 'object') {
    console.error('Invalid clue list response:', response)
    return {
      sessionId: null,
      scenarioId: null,
      clues: [],
    }
  }

  // clues 필드가 있는 경우
  let clues = []
  if (Array.isArray(response.clues)) {
    clues = response.clues.map(normalizeClue).filter(Boolean)
  } else if (Array.isArray(response.content)) {
    // 페이징 응답인 경우
    clues = response.content.map(normalizeClue).filter(Boolean)
  }

  return {
    sessionId: response.sessionId || null,
    scenarioId: response.scenarioId || null,
    clues,
  }
}

// ========================================
// Suspect Mappers
// ========================================

/**
 * Normalize suspect from API response
 * @param {Object} suspect - API suspect
 * @returns {Object} Normalized suspect
 */
export const normalizeSuspect = (suspect) => {
  if (!suspect || typeof suspect !== 'object') {
    return null
  }

  return {
    id: suspect.suspectId,
    name: suspect.name || '',
    age: suspect.age || 0,
    gender: suspect.gender || '',
    occupation: suspect.occupation || '',
    oneLiner: suspect.oneLiner || '',
    portraitUrl: suspect.portraitUrl || '',
    displayOrder: suspect.displayOrder || 0,
  }
}

/**
 * Normalize suspect list response from API
 * @param {Object} response - API suspect list response
 * @returns {Object} Normalized suspect list data
 */
export const normalizeSuspectListResponse = (response) => {
  if (!response || typeof response !== 'object') {
    console.error('Invalid suspect list response:', response)
    return {
      scenarioId: null,
      suspects: [],
    }
  }

  const suspects = Array.isArray(response.suspects)
    ? response.suspects.map(normalizeSuspect).filter(Boolean)
    : []

  return {
    scenarioId: response.scenarioId || null,
    suspects,
  }
}

// ========================================
// Submit Validation Mappers
// ========================================

/**
 * Normalize required red connection from API response
 * @param {Object} connection - API required red connection
 * @returns {Object} Normalized required red connection
 */
export const normalizeRequiredRedConnection = (connection) => {
  if (!connection || typeof connection !== 'object') {
    return null
  }

  return {
    fromType: connection.fromType || '',
    toType: connection.toType || '',
    description: connection.description || '',
  }
}

/**
 * Normalize submit validate response from API
 * @param {Object} response - API submit validate response
 * @returns {Object} Normalized validation data
 */
export const normalizeSubmitValidateResponse = (response) => {
  if (!response || typeof response !== 'object') {
    console.error('Invalid submit validate response:', response)
    return {
      sessionId: null,
      submittable: false,
      missing: [],
      requiredRedConnections: [],
    }
  }

  const missing = Array.isArray(response.missing) ? response.missing : []
  const requiredRedConnections = Array.isArray(response.requiredRedConnections)
    ? response.requiredRedConnections.map(normalizeRequiredRedConnection).filter(Boolean)
    : []

  return {
    sessionId: response.sessionId || null,
    submittable: response.submittable || false,
    missing,
    requiredRedConnections,
  }
}

// ========================================
// Submit Response Mappers
// ========================================

/**
 * Normalize evaluation from API response
 * @param {Object} evaluation - API evaluation
 * @returns {Object} Normalized evaluation
 */
export const normalizeEvaluation = (evaluation) => {
  if (!evaluation || typeof evaluation !== 'object') {
    return null
  }

  return {
    culpritCorrect: evaluation.culpritCorrect || false,
    weaponCorrect: evaluation.weaponCorrect || false,
    locationCorrect: evaluation.locationCorrect || false,
    motiveSimilarity: evaluation.motiveSimilarity || 0,
    aiComment: evaluation.aiComment || '',
  }
}

/**
 * Normalize submit response from API
 * @param {Object} response - API submit response
 * @returns {Object} Normalized submit result
 */
export const normalizeSubmitResponse = (response) => {
  if (!response || typeof response !== 'object') {
    console.error('Invalid submit response:', response)
    return {
      sessionId: null,
      status: '',
      attemptsUsed: 0,
      completedAt: null,
      finalScore: 0,
      rankGrade: '',
      evaluation: null,
    }
  }

  return {
    sessionId: response.sessionId || null,
    status: response.status || '',
    attemptsUsed: response.attemptsUsed || 0,
    completedAt: response.completedAt || null,
    finalScore: response.finalScore || 0,
    rankGrade: response.rankGrade || '',
    evaluation: response.evaluation ? normalizeEvaluation(response.evaluation) : null,
  }
}

// ========================================
// Resume Mappers
// ========================================

/**
 * Normalize inventory clue from API response
 * @param {Object} clue - API inventory clue
 * @returns {Object} Normalized inventory clue
 */
export const normalizeInventoryClue = (clue) => {
  if (!clue || typeof clue !== 'object') {
    return null
  }

  return {
    clueId: clue.clueId,
    name: clue.name || '',
    importance: clue.importance || '',
    discoveredAt: clue.discoveredAt || null,
  }
}

/**
 * Normalize board from resume response
 * @param {Object} board - API board from resume
 * @returns {Object} Normalized board
 */
export const normalizeResumeBoard = (board) => {
  if (!board || typeof board !== 'object') {
    return {
      nodes: [],
      connections: [],
      redConnectionCount: 0,
    }
  }

  const nodes = Array.isArray(board.nodes)
    ? board.nodes.map(normalizeBoardNode).filter(Boolean)
    : []

  const connections = Array.isArray(board.connections)
    ? board.connections.map(normalizeBoardConnection).filter(Boolean)
    : []

  return {
    nodes,
    connections,
    redConnectionCount: board.redConnectionCount || 0,
  }
}

/**
 * Normalize game resume response from API
 * @param {Object} response - API resume response
 * @returns {Object} Normalized resume data
 */
export const normalizeResumeResponse = (response) => {
  if (!response || typeof response !== 'object') {
    console.error('Invalid resume response:', response)
    return {
      sessionId: null,
      scenarioId: null,
      userId: null,
      status: '',
      currentFloor: 1,
      visitedFloors: [],
      health: 0,
      submitAttempts: 0,
      playTime: 0,
      submitAttempts: response.submitAttempts || 0,
      remainingAttempts: Math.max(0, 3 - (response.submitAttempts || 0)),
      lastSavedAt: null,
      expiresAt: null,
      inventory: { clues: [] },
      board: { nodes: [], connections: [], redConnectionCount: 0 },
    }
  }

  const inventoryClues = response.inventory?.clues
    ? Array.isArray(response.inventory.clues)
      ? response.inventory.clues.map(normalizeInventoryClue).filter(Boolean)
      : []
    : []

  return {
    sessionId: response.sessionId || null,
    scenarioId: response.scenarioId || null,
    userId: response.userId || null,
    status: response.status || '',
    currentFloor: clampFloor(response.currentFloor ?? response.currentRoom?.floorNumber, 1),
    visitedFloors: Array.isArray(response.visitedFloors)
      ? response.visitedFloors.map((floor) => clampFloor(floor, 1))
      : [],
    health: response.health || 0,
    submitAttempts: response.submitAttempts || 0,
    remainingAttempts: Math.max(0, 3 - (response.submitAttempts || 0)),  // ✅ 남은 제출 횟수
    playTime: response.playTime || 0,
    lastSavedAt: response.lastSavedAt || null,
    expiresAt: response.expiresAt || null,
    inventory: {
      clues: inventoryClues,
    },
    board: response.board ? normalizeResumeBoard(response.board) : { nodes: [], connections: [], redConnectionCount: 0 },
  }
}

// ========================================
// Board Item Mappers (for UI rendering)
// ========================================

/**
 * Create UI board item from normalized data
 * Maps board nodes to UI-compatible format
 * @param {Object} node - Normalized board node
 * @param {Object} suspectsMap - Map of suspectId -> suspect data
 * @param {Object} cluesMap - Map of clueId -> clue data
 * @returns {Object|null} UI board item
 */
export const createBoardItem = (node, suspectsMap, cluesMap) => {
  if (!node) return null

  const baseItem = {
    id: node.id,
    x: node.x,
    y: node.y,
    type: node.type?.toLowerCase() || 'note',
  }

  if (node.type === NodeType.SUSPECT) {
    const suspect = suspectsMap[node.targetId]
    if (!suspect) return null
    return {
      ...baseItem,
      type: 'suspect',
      name: suspect.name,
      note: suspect.oneLiner || '',
      image: suspect.portraitUrl || '',
      targetId: node.targetId,
    }
  }

  if (node.type === NodeType.CLUE) {
    const clue = cluesMap[node.targetId]
    if (!clue) return null
    return {
      ...baseItem,
      type: 'evidence',
      name: clue.name,
      note: clue.importance || '',
      image: '', // Clues don't have images in the current schema
      targetId: node.targetId,
    }
  }

  if (node.type === NodeType.MEMO) {
    return {
      ...baseItem,
      type: 'note',
      name: '메모',
      note: node.memoContent || '',
      image: '',
    }
  }

  return null
}

/**
 * Create UI board items from normalized board data
 * @param {Object} boardData - Normalized board data
 * @param {Array} suspects - List of suspects
 * @param {Array} clues - List of clues
 * @returns {Array} UI board items
 */
export const createBoardItems = (boardData, suspects = [], clues = []) => {
  const suspectsMap = {}
  for (const suspect of suspects) {
    suspectsMap[suspect.id] = suspect
  }

  const cluesMap = {}
  for (const clue of clues) {
    cluesMap[clue.id] = clue
  }

  return boardData.nodes
    .map(node => createBoardItem(node, suspectsMap, cluesMap))
    .filter(Boolean)
}

// ========================================
// Event Log Mappers
// ========================================

/**
 * Normalize event log from API response
 * @param {Object} log - API event log
 * @returns {Object} Normalized event log
 */
export const normalizeEventLog = (log) => {
  if (!log || typeof log !== 'object') {
    return null
  }

  return {
    type: log.type || '',
    message: log.message || '',
    createdAt: log.createdAt || null,
  }
}

/**
 * Normalize event log list response from API
 * @param {Object} response - API event log list response
 * @returns {Object} Normalized event log list data
 */
export const normalizeEventLogListResponse = (response) => {
  // 응답이 직접 배열인 경우
  if (Array.isArray(response)) {
    return {
      sessionId: null,
      logs: response.map(normalizeEventLog).filter(Boolean),
    }
  }

  if (!response || typeof response !== 'object') {
    console.error('Invalid event log list response:', response)
    return {
      sessionId: null,
      logs: [],
    }
  }

  // logs 필드가 있는 경우
  let logs = []
  if (Array.isArray(response.logs)) {
    logs = response.logs.map(normalizeEventLog).filter(Boolean)
  } else if (Array.isArray(response.eventLogs)) {
    logs = response.eventLogs.map(normalizeEventLog).filter(Boolean)
  } else if (Array.isArray(response.content)) {
    // 페이징 응답인 경우
    logs = response.content.map(normalizeEventLog).filter(Boolean)
  }

  return {
    sessionId: response.sessionId || null,
    logs,
  }
}

// ========================================
// Investigation Report Mappers
// ========================================

/**
 * Normalize key talk from API response
 * @param {Object} keyTalk - API key talk
 * @returns {Object} Normalized key talk
 */
export const normalizeKeyTalk = (keyTalk) => {
  if (!keyTalk || typeof keyTalk !== 'object') {
    return null
  }

  return {
    suspectId: keyTalk.suspectId,
    content: keyTalk.content || '',
    createdAt: keyTalk.createdAt || null,
  }
}

/**
 * Normalize stats from API response
 * @param {Object} stats - API stats
 * @returns {Object} Normalized stats
 */
export const normalizeStats = (stats) => {
  if (!stats || typeof stats !== 'object') {
    return null
  }

  return {
    totalInterrogations: stats.totalInterrogations || 0,
    cluesCollected: stats.cluesCollected || 0,
  }
}

/**
 * Normalize investigation report response from API
 * @param {Object} response - API investigation report response
 * @returns {Object} Normalized investigation report
 */
export const normalizeInvestigationReportResponse = (response) => {
  if (!response || typeof response !== 'object') {
    console.error('Invalid investigation report response:', response)
    return {
      sessionId: null,
      scenarioId: null,
      userId: null,
      playerName: '',
      scenarioTitle: '',
      rankGrade: '',
      finalScore: 0,
      playTimeMinutes: 0,
      summary: '',
      aiComment: '',
      stats: null,
      keyTalks: [],
    }
  }

  return {
    sessionId: response.sessionId || null,
    scenarioId: response.scenarioId || null,
    userId: response.userId || null,
    playerName: response.playerName || '',
    scenarioTitle: response.scenarioTitle || '',
    rankGrade: response.rankGrade || '',
    finalScore: response.finalScore || 0,
    playTimeMinutes: response.playTimeMinutes || 0,
    summary: response.summary || '',
    aiComment: response.aiComment || '',
    stats: response.stats ? normalizeStats(response.stats) : null,
    keyTalks: Array.isArray(response.keyTalks)
      ? response.keyTalks.map(normalizeKeyTalk).filter(Boolean)
      : [],
  }
}

// ========================================
// Game Start/End Mappers
// ========================================

/**
 * Normalize current room from API response
 * @param {Object} room - API current room
 * @returns {Object} Normalized current room
 */
export const normalizeCurrentRoom = (room) => {
  if (!room || typeof room !== 'object') {
    return null
  }

  return {
    floorNumber: clampFloor(room.floorNumber, 1),
    roomName: room.roomName || '',
    roomType: room.roomType || '',
    objects: room.objects || null,
  }
}

/**
 * Normalize game start response from API
 * @param {Object} response - API game start response
 * @returns {Object} Normalized game start data
 */
export const normalizeGameStartResponse = (response) => {
  if (!response || typeof response !== 'object') {
    console.error('Invalid game start response:', response)
    return {
      sessionId: null,
      scenarioId: null,
      userId: null,
      status: '',
      startedAt: null,
      scenario: null,
      victim: null,
      currentFloor: 1,
      currentRoom: null,
      eventLog: null,
    }
  }

  return {
    sessionId: response.sessionId || null,
    scenarioId: response.scenarioId || null,
    userId: response.userId || null,
    status: response.status || '',
    startedAt: response.startedAt || null,
    scenario: response.scenario || null,
    victim: response.victim || null,
    currentFloor: clampFloor(response.currentFloor ?? response.currentRoom?.floorNumber, 1),
    currentRoom: response.currentRoom ? normalizeCurrentRoom(response.currentRoom) : null,
    eventLog: response.eventLog ? normalizeEventLog(response.eventLog) : null,
  }
}

/**
 * Normalize game end response from API
 * @param {Object} response - API game end response
 * @returns {Object} Normalized game end data
 */
export const normalizeGameEndResponse = (response) => {
  if (!response || typeof response !== 'object') {
    console.error('Invalid game end response:', response)
    return {
      sessionId: null,
      status: '',
      isSuccess: false,
      completedAt: null,
      finalScore: 0,
      rankGrade: '',
    }
  }

  return {
    sessionId: response.sessionId || null,
    status: response.status || '',
    isSuccess: response.isSuccess || false,
    completedAt: response.completedAt || null,
    finalScore: response.finalScore || 0,
    rankGrade: response.rankGrade || '',
  }
}

/**
 * Normalize floor move response from API
 * @param {Object} response - API floor move response
 * @returns {Object} Normalized floor move data
 */
export const normalizeFloorMoveResponse = (response) => {
  if (!response || typeof response !== 'object') {
    console.error('Invalid floor move response:', response)
    return {
      sessionId: null,
      currentFloor: 1,
      isFirstVisit: false,
      room: null,
      eventLog: null,
    }
  }

  return {
    sessionId: response.sessionId || null,
    currentFloor: clampFloor(response.currentFloor ?? response.currentRoom?.floorNumber, 1),
    isFirstVisit: response.isFirstVisit || false,
    room: response.room ? normalizeCurrentRoom(response.room) : null,
    eventLog: response.eventLog ? normalizeEventLog(response.eventLog) : null,
  }
}

// ========================================
// Clue Detail Mappers
// ========================================

/**
 * Normalize clue detail from API response
 * @param {Object} clue - API clue detail
 * @returns {Object} Normalized clue detail
 */
export const normalizeClueDetail = (clue) => {
  if (!clue || typeof clue !== 'object') {
    return null
  }

  return {
    ...normalizeClue(clue),
    description: clue.description || '',
    detailImageUrl: clue.detailImageUrl || '',
    assistantComment: clue.assistantComment || '',
    clueDetail: clue.clueDetail || null,
    transform: clue.transform || null,
  }
}

/**
 * Normalize clue detail response from API
 * @param {Object} response - API clue detail response
 * @returns {Object} Normalized clue detail data
 */
export const normalizeClueDetailResponse = (response) => {
  if (!response || typeof response !== 'object') {
    console.error('Invalid clue detail response:', response)
    return null
  }

  return normalizeClueDetail(response)
}

/**
 * Normalize discovered clue response from API
 * @param {Object} response - API discovered clue response
 * @returns {Object} Normalized discovered clue data
 */
export const normalizeDiscoveredClueResponse = (response) => {
  if (!response || typeof response !== 'object') {
    console.error('Invalid discovered clue response:', response)
    return {
      sessionId: null,
      clue: null,
      discoveredAt: null,
    }
  }

  return {
    sessionId: response.sessionId || null,
    clue: response.clue ? normalizeClue(response.clue) : null,
    discoveredAt: response.discoveredAt || null,
  }
}

// ========================================
// Room Mappers
// ========================================

/**
 * Normalize room from API response
 * @param {Object} room - API room
 * @returns {Object} Normalized room
 */
export const normalizeRoom = (room) => {
  if (!room || typeof room !== 'object') {
    return null
  }

  return {
    id: room.roomId,
    floorNumber: clampFloor(room.floorNumber, 1),
    roomType: room.roomType,
    name: room.roomName,
    description: room.description,
    assistantComment: room.assistantComment,
    objects: room.objects,
    unlocked: true, // 기본값
  }
}

/**
 * Normalize room list response from API
 * @param {Object} response - API room list response
 * @returns {Object} Normalized room list data
 */
export const normalizeRoomListResponse = (response) => {
  if (!response || typeof response !== 'object') {
    console.error('Invalid room list response:', response)
    return {
      scenarioId: null,
      scenarioTitle: '',
      rooms: [],
    }
  }

  return {
    scenarioId: response.scenarioId || null,
    scenarioTitle: response.scenarioTitle || '',
    rooms: Array.isArray(response.rooms)
      ? response.rooms.map(normalizeRoom).filter(Boolean)
      : [],
  }
}

export default {
  // Board
  normalizeBoardNode,
  normalizeBoardConnection,
  normalizeBoardResponse,
  createBoardItem,
  createBoardItems,
  // Clues
  normalizeClue,
  normalizeClueListResponse,
  normalizeClueDetail,
  normalizeClueDetailResponse,
  normalizeDiscoveredClueResponse,
  // Suspects
  normalizeSuspect,
  normalizeSuspectListResponse,
  // Submit
  normalizeRequiredRedConnection,
  normalizeSubmitValidateResponse,
  normalizeEvaluation,
  normalizeSubmitResponse,
  // Resume
  normalizeInventoryClue,
  normalizeResumeBoard,
  normalizeResumeResponse,
  // Event Logs
  normalizeEventLog,
  normalizeEventLogListResponse,
  // Investigation Report
  normalizeKeyTalk,
  normalizeStats,
  normalizeInvestigationReportResponse,
  // Game Start/End
  normalizeCurrentRoom,
  normalizeGameStartResponse,
  normalizeGameEndResponse,
  normalizeFloorMoveResponse,
  // Room
  normalizeRoom,
  normalizeRoomListResponse,
  // Bookshelf
  mapBookshelfItem,
  mapBookshelfStatsResponse,
  mapBookshelfSessionResponse,
  // Enums
  NodeType,
  ConnectionType,
}
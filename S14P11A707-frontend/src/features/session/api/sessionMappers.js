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
 * Connection type enum
 */
export const ConnectionType = {
  CONFIRMED: 'confirmed',
  SUSPECTED: 'suspected',
  CONTRADICTION: 'contradiction',
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
    floorNumber: clue.floorNumber,
    name: clue.name || '',
    importance: clue.importance || '',
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
  if (!response || typeof response !== 'object') {
    console.error('Invalid clue list response:', response)
    return {
      sessionId: null,
      scenarioId: null,
      clues: [],
    }
  }

  const clues = Array.isArray(response.clues)
    ? response.clues.map(normalizeClue).filter(Boolean)
    : []

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
    causeOfDeathSimilarity: evaluation.causeOfDeathSimilarity || 0,
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
      currentFloor: 0,
      visitedFloors: [],
      health: 0,
      submitAttempts: 0,
      playTime: 0,
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
    currentFloor: response.currentFloor || 0,
    visitedFloors: Array.isArray(response.visitedFloors) ? response.visitedFloors : [],
    health: response.health || 0,
    submitAttempts: response.submitAttempts || 0,
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
  // Enums
  NodeType,
  ConnectionType,
}

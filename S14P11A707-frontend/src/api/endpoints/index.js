const API_BASE_URL = '/api/v1'

/**
 * API 엔드포인트 상수
 */
export const ENDPOINTS = {
  // ========================================
  // Auth API
  // ========================================
  auth: {
    me: '/api/auth/me',
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    refresh: '/api/auth/refresh',
  },

  // ========================================
  // Ranking API
  // ========================================
  rankings: `${API_BASE_URL}/rankings`,
  myRankings: `${API_BASE_URL}/users/me/rankings`,

  // ========================================
  // Scenario API
  // ========================================
  scenarios: {
    base: `${API_BASE_URL}/scenarios`,
    list: `${API_BASE_URL}/scenarios`,
    detail: (scenarioId) => `${API_BASE_URL}/scenarios/${scenarioId}`,
    reviews: (scenarioId) => `${API_BASE_URL}/scenarios/${scenarioId}/reviews`,
    rankings: (scenarioId) => `${API_BASE_URL}/scenarios/${scenarioId}/rankings`,
    sessions: (scenarioId) => `${API_BASE_URL}/scenarios/${scenarioId}/sessions`,
    suspects: (scenarioId) => `${API_BASE_URL}/scenarios/${scenarioId}/suspects`,
    victim: (scenarioId) => `${API_BASE_URL}/scenarios/${scenarioId}/victim`,
    rooms: (scenarioId) => `${API_BASE_URL}/scenarios/${scenarioId}/rooms`,
    status: (scenarioId) => `${API_BASE_URL}/scenarios/${scenarioId}/status`,
    search: `${API_BASE_URL}/scenarios/search`,
  },

  // ========================================
  // Session API
  // ========================================
  sessions: {
    base: `${API_BASE_URL}/sessions`,
    detail: (sessionId) => `${API_BASE_URL}/sessions/${sessionId}`,
    board: (sessionId) => `${API_BASE_URL}/sessions/${sessionId}/board`,
    clues: (sessionId) => `${API_BASE_URL}/sessions/${sessionId}/clues`,
    clue: (sessionId, clueId) => `${API_BASE_URL}/sessions/${sessionId}/clues/${clueId}`,
    logs: (sessionId) => `${API_BASE_URL}/sessions/${sessionId}/logs`,
    report: (sessionId) => `${API_BASE_URL}/sessions/${sessionId}/report`,
    submit: (sessionId) => `${API_BASE_URL}/sessions/${sessionId}/submit`,
    validate: (sessionId) => `${API_BASE_URL}/sessions/${sessionId}/submit/validate`,
    resume: (sessionId) => `${API_BASE_URL}/sessions/${sessionId}/resume`,
    moveFloor: (sessionId) => `${API_BASE_URL}/sessions/${sessionId}/move-floor`,
    end: (sessionId) => `${API_BASE_URL}/sessions/${sessionId}/end`,
    chat: (sessionId, suspectId) => `${API_BASE_URL}/sessions/${sessionId}/suspects/${suspectId}/chat`,
    chatHistory: (sessionId, suspectId) => `${API_BASE_URL}/sessions/${sessionId}/suspects/${suspectId}/chats`,
    save: (sessionId) => `${API_BASE_URL}/sessions/${sessionId}`,
    boardNodes: (sessionId) => `${API_BASE_URL}/sessions/${sessionId}/board/nodes`,
    boardNodePosition: (sessionId) => `${API_BASE_URL}/sessions/${sessionId}/board/nodes/position`,
    boardConnections: (sessionId) => `${API_BASE_URL}/sessions/${sessionId}/board/connections`,
  },

  // ========================================
  // User API
  // ========================================
  users: {
    me: {
      nickname: `${API_BASE_URL}/users/me/nickname`,
      scenarios: `${API_BASE_URL}/users/me/scenarios`,
      activeSessions: `${API_BASE_URL}/users/me/sessions/active`,
      bookshelfStats: `${API_BASE_URL}/users/me/bookshelf/stats`,
      bookshelfFailed: `${API_BASE_URL}/users/me/bookshelf/failed`,
      bookshelfCompleted: `${API_BASE_URL}/users/me/bookshelf/completed`,
    },
  },

  // ========================================
  // Review API
  // ========================================
  reviews: {
    detail: (reviewId) => `${API_BASE_URL}/reviews/${reviewId}`,
  },
}

export default ENDPOINTS

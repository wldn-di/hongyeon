/**
 * API 엔드포인트 상수
 * OpenAPI specification 기반으로 작성됨
 * 모든 경로는 /api/ 접두사 사용 (v1 아님)
 */
export const ENDPOINTS = {
  // ========================================
  // Auth API
  // ========================================
  auth: {
    me: "/api/auth/me",
    login: "/api/auth/login",
    logout: "/api/auth/logout",
    refresh: "/api/auth/refresh",
  },

  // ========================================
  // Ranking API
  // ========================================
  rankings: {
    top10: "/api/rankings", // 공개 (Top10)
    me: "/api/rankings/me", // 로그인 (내 랭킹)
    // TODO: 아래는 아직 백엔드에 api 없음
    all: "/api/rankings/all", // (예상) 전체 랭킹
    search: "/api/rankings/search", // (예상) 닉네임 검색
  },

  // ========================================
  // Scenario API
  // ========================================
  scenarios: {
    list: "/api/scenarios",
    create: "/api/scenarios",
    detail: (scenarioId) => `/api/scenarios/${scenarioId}`,
    delete: (scenarioId) => `/api/scenarios/${scenarioId}`,
    suspects: (scenarioId) => `/api/scenarios/${scenarioId}/suspects`,
    victim: (scenarioId) => `/api/scenarios/${scenarioId}/victim`,
    rooms: (scenarioId) => `/api/scenarios/${scenarioId}/rooms`,
    rankings: (scenarioId) => `/api/scenarios/${scenarioId}/rankings`,
    status: (scenarioId) => `/api/scenarios/${scenarioId}/status`,
    search: "/api/scenarios/search",
    topByRating: "/api/scenarios/top/rating",
    topByPlayCount: "/api/scenarios/top/play-count",
  },

  // ========================================
  // Scenario v2 API (Async + SSE)
  // ========================================
  scenariosV2: {
    create: "/api/v2/scenarios",
    stream: "/api/v2/scenarios/stream",
  },

  // ========================================
  // Session API
  // ========================================
  sessions: {
    // Game start (POST with scenarioId)
    start: (scenarioId) => `/api/sessions/${scenarioId}`,
    restart: (scenarioId) => `/api/sessions/${scenarioId}/restart`,

    // Session detail operations
    detail: (sessionId) => `/api/sessions/${sessionId}`,
    save: (sessionId) => `/api/sessions/${sessionId}`,
    resume: (sessionId) => `/api/sessions/${sessionId}/resume`,
    end: (sessionId) => `/api/sessions/${sessionId}/end`,
    moveFloor: (sessionId) => `/api/sessions/${sessionId}/move-floor`,

    // Board operations (조회/저장만)
    board: (sessionId) => `/api/sessions/${sessionId}/board`,

    // Clue operations
    clues: (sessionId) => `/api/sessions/${sessionId}/clues`,
    clueDetail: (sessionId, clueId) =>
      `/api/sessions/${sessionId}/clues/${clueId}`,

    // Logs
    logs: (sessionId) => `/api/sessions/${sessionId}/logs`,

    // Report
    report: (sessionId) => `/api/sessions/${sessionId}/report`,
    reportPublic: (sessionId) => `/api/sessions/${sessionId}/report/public`,

    // Submit
    submit: (sessionId) => `/api/sessions/${sessionId}/submit`,

    // Chat (용의자 심문)
    suspectChat: (sessionId, suspectId) =>
      `/api/sessions/${sessionId}/suspects/${suspectId}/chat`,
    suspectChatHistory: (sessionId, suspectId) =>
      `/api/sessions/${sessionId}/suspects/${suspectId}/chats`,
  },

  // ========================================
  // Review API
  // ========================================
  reviews: {
    list: (scenarioId) => `/api/reviews/${scenarioId}/reviews`,
    create: (scenarioId) => `/api/reviews/${scenarioId}/reviews`,
    detail: (reviewId) => `/api/reviews/${reviewId}`,
    update: (reviewId) => `/api/reviews/${reviewId}`,
    delete: (reviewId) => `/api/reviews/${reviewId}`,
  },

  // ========================================
  // User(Me) API
  // ========================================
  users: {
    me: {
      scenarios: "/api/users/me/scenarios",
      bookshelfStats: "/api/users/me/bookshelf/stats",
      bookshelfSessions: "/api/users/me/bookshelf/sessions",
      nickname: "/api/users/me/nickname",
    },
  },
};

export default ENDPOINTS;

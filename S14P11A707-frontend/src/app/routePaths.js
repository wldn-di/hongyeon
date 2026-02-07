// 세션 스토리지 키
export const POST_LOGIN_REDIRECT_KEY = "post_login_redirect";

// 경로 상수 - 모든 라우트 경로를 한 곳에서 관리
export const ROUTES = {
  HOME: "/",
  TUTORIAL: "/tutorial",
  SCENARIOS: "/scenarios",
  SCENARIO_DETAIL: "/scenario/:id",
  CREATE_SCENARIO: "/create-scenario",
  RANKING: "/ranking",
  PROFILE: "/me",
  BOARD: "/board/:scenarioId",
  BOARD_SESSION: "/board/session/:sessionId",
  MY_BOOKSHELF: "/my-bookshelf",
  GAME: "/game/:scenarioId",
  GAME_SOLO: "/room/:scenarioId/solo",
  GAME_RESUME: "/room/:sessionId/resume",
  SUBMIT: "/submit/:scenarioId",
  SUBMIT_SESSION: "/submit/session/:sessionId",
  NOT_FOUND: "/404",
};

// 경로 생성 헬퍼 함수
export const createPath = {
  scenarioDetail: (id) => `/scenario/${id}`,
  board: (scenarioId) => `/board/${scenarioId}`,
  boardSession: (sessionId) => `/board/session/${sessionId}`,
  game: (scenarioId) => `/game/${scenarioId}`,
  gameSolo: (scenarioId) => `/room/${scenarioId}/solo`,
  gameResume: (sessionId) => `/room/${sessionId}/resume`,
  submit: (scenarioId) => `/submit/${scenarioId}`,
  submitSession: (sessionId) => `/submit/session/${sessionId}`,
};

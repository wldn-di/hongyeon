import { apiClient } from "@/api/client/axios";
import { ENDPOINTS } from "@/api/endpoints";
import { ApiError } from "@/api/errors/ApiError";

/**
 * Session API Module
 * OpenAPI spec 기반으로 작성됨
 */

// ========================================
// Game Start/Resume/End API
// ========================================

/**
 * 게임 시작 (POST /api/sessions/{scenarioId})
 * @param {number} scenarioId
 * @returns {Promise<GameStartResponse>}
 * @throws {ApiError}
 */
export const startGame = async (scenarioId) => {
  try {
    const response = await apiClient.post(ENDPOINTS.sessions.start(scenarioId));
    return response.data;
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error);
    }
    throw new ApiError("게임 시작에 실패했습니다.");
  }
};

/**
 * 게임 재시작 (POST /api/sessions/{scenarioId}/restart)
 * @param {number} scenarioId
 * @returns {Promise<GameStartResponse>}
 * @throws {ApiError}
 */
export const restartGame = async (scenarioId) => {
  try {
    const response = await apiClient.post(ENDPOINTS.sessions.restart(scenarioId));
    return response.data;
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error);
    }
    throw new ApiError("게임 재시작에 실패했습니다.");
  }
};

/**
 * 이어하기 (GET /api/sessions/{sessionId}/resume)
 * @param {number} sessionId
 * @returns {Promise<GameResumeResponse>}
 * @throws {ApiError}
 */
export const fetchResume = async (sessionId) => {
  try {
    const response = await apiClient.get(ENDPOINTS.sessions.resume(sessionId));
    return response.data;
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error);
    }
    throw new ApiError("이어하기 데이터를 불러오는데 실패했습니다.");
  }
};

/**
 * 층 이동 (POST /api/sessions/{sessionId}/move-floor)
 * @param {number} sessionId
 * @param {number} targetFloor
 * @returns {Promise<FloorMoveResponse>}
 * @throws {ApiError}
 */
export const moveFloor = async (sessionId, targetFloor) => {
  try {
    const payload = { targetFloor };
    const response = await apiClient.post(
      ENDPOINTS.sessions.moveFloor(sessionId),
      payload,
    );
    return response.data;
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error);
    }
    throw new ApiError("층 이동에 실패했습니다.");
  }
};

// ========================================
// Board API
// ========================================

/**
 * 보드 조회 (GET /api/sessions/{sessionId}/board)
 * @param {number} sessionId
 * @returns {Promise<BoardResponse>}
 * @throws {ApiError}
 */
export const fetchBoard = async (sessionId) => {
  try {
    const response = await apiClient.get(ENDPOINTS.sessions.board(sessionId));
    return response.data;
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error);
    }
    throw new ApiError("보드 데이터를 불러오는데 실패했습니다.");
  }
};

/**
 * 보드 전체 저장 (PUT /api/sessions/{sessionId}/board)
 * @param {number} sessionId
 * @param {BoardSaveRequest} data - { nodes: [{ type, targetId, memoContent, x, y }], connections: [{ fromIndex, toIndex, type }] }
 * @returns {Promise<BoardResponse>}
 * @throws {ApiError}
 */
export const saveBoard = async (sessionId, data) => {
  try {
    const response = await apiClient.put(
      ENDPOINTS.sessions.board(sessionId),
      data
    );
    return response.data;
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error);
    }
    throw new ApiError("보드 저장에 실패했습니다.");
  }
};
// ========================================
// Clues API
// ========================================

/**
 * 단서 목록 조회 (GET /api/sessions/{sessionId}/clues)
 * @param {number} sessionId
 * @returns {Promise<ClueListResponse>}
 * @throws {ApiError}
 */
export const fetchClues = async (sessionId) => {
  try {
    const response = await apiClient.get(ENDPOINTS.sessions.clues(sessionId));
    return response.data;
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error);
    }
    throw new ApiError("단서 목록을 불러오는데 실패했습니다.");
  }
};

/**
 * 단서 상세 조회 (GET /api/sessions/{sessionId}/clues/{clueId})
 * @param {number} sessionId
 * @param {number} clueId
 * @returns {Promise<ClueDetailResponse>}
 * @throws {ApiError}
 */
export const fetchClueDetail = async (sessionId, clueId) => {
  try {
    const response = await apiClient.get(
      ENDPOINTS.sessions.clueDetail(sessionId, clueId),
    );
    return response.data;
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error);
    }
    throw new ApiError("단서 상세 정보를 불러오는데 실패했습니다.");
  }
};

/**
 * 단서 획득 (POST /api/sessions/{sessionId}/clues/{clueId})
 * @param {number} sessionId
 * @param {number} clueId
 * @returns {Promise<DiscoveredClueResponse>}
 * @throws {ApiError}
 */
export const discoverClue = async (sessionId, clueId) => {
  try {
    const response = await apiClient.post(
      ENDPOINTS.sessions.clueDetail(sessionId, clueId),
    );
    return response.data;
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error);
    }
    throw new ApiError("단서 획득에 실패했습니다.");
  }
};

// ========================================
// Report API
// ========================================

/**
 * 내 수사보고서 조회 (GET /api/sessions/{sessionId}/report)
 * @param {number} sessionId
 * @returns {Promise<InvestigationReportResponse>}
 * @throws {ApiError}
 */
export const fetchMyReport = async (sessionId) => {
  try {
    const response = await apiClient.get(ENDPOINTS.sessions.report(sessionId));
    return response.data;
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error);
    }
    throw new ApiError("수사보고서를 불러오는데 실패했습니다.");
  }
};

/**
 * 타인 수사보고서 조회 (GET /api/sessions/{sessionId}/report/public)
 * @param {number} sessionId
 * @returns {Promise<InvestigationReportResponse>}
 * @throws {ApiError}
 */
export const fetchPublicReport = async (sessionId) => {
  try {
    const response = await apiClient.get(
      ENDPOINTS.sessions.reportPublic(sessionId),
    );
    return response.data;
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error);
    }
    throw new ApiError("수사보고서를 불러오는데 실패했습니다.");
  }
};

// ========================================
// Submit API
// ========================================

/**
 * 최종 정답 제출 (POST /api/sessions/{sessionId}/submit)
 * @param {number} sessionId
 * @param {SubmitRequest} data - { culpritId, weaponClueId, locationFloor, motive }
 * @returns {Promise<SubmitResponse>}
 * @throws {ApiError}
 */
export const submitAnswer = async (sessionId, data) => {
  try {
    const response = await apiClient.post(
      ENDPOINTS.sessions.submit(sessionId),
      data,
    );
    return response.data;
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error);
    }
    throw new ApiError("정답 제출에 실패했습니다.");
  }
};

// ========================================
// Chat API (용의자 심문)
// ========================================

/**
 * 용의자 심문 (POST /api/sessions/{sessionId}/suspects/{suspectId}/chat)
 * @param {number} sessionId
 * @param {number} suspectId
 * @param {SuspectChatRequest} data - { message, usedClueId }
 * @returns {Promise<SuspectChatResponse>}
 * @throws {ApiError}
 */
export const chatWithSuspect = async (sessionId, suspectId, data) => {
  try {
    const response = await apiClient.post(
      ENDPOINTS.sessions.suspectChat(sessionId, suspectId),
      data,
    );
    return response.data;
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error);
    }
    throw new ApiError("심문에 실패했습니다.");
  }
};

/**
 * 용의자 심문 기록 조회 (GET /api/sessions/{sessionId}/suspects/{suspectId}/chats)
 * @param {number} sessionId
 * @param {number} suspectId
 * @returns {Promise<ChatHistoryResponse>}
 * @throws {ApiError}
 */
export const fetchChatHistory = async (sessionId, suspectId) => {
  try {
    const response = await apiClient.get(
      ENDPOINTS.sessions.suspectChatHistory(sessionId, suspectId),
    );
    return response.data;
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error);
    }
    throw new ApiError("심문 기록을 불러오는데 실패했습니다.");
  }
};

export default {
  // Game lifecycle
  startGame,
  restartGame,
  fetchResume,
  moveFloor,
  // Board (조회/저장만)
  fetchBoard,
  saveBoard,
  // Clues
  fetchClues,
  fetchClueDetail,
  discoverClue,
  // Report
  fetchMyReport,
  fetchPublicReport,
  // Submit
  submitAnswer,
  // Chat
  chatWithSuspect,
  fetchChatHistory,
};
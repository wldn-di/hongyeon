import { apiClient } from "@/api/client/axios";
import { ENDPOINTS } from "@/api/endpoints";
import { ApiError } from "@/api/errors/ApiError";

/**
 * Scenario API Module
 * OpenAPI spec 기반으로 작성됨
 */

/**
 * Spring 호환 배열 쿼리 직렬화
 * genres=crime&genres=mystery 형태로 전송
 */
const paramsSerializer = (params) => {
  const sp = new URLSearchParams();

  const CSV_KEYS = new Set(["genres", "difficulties"]);

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (Array.isArray(value)) {
      const arr = value.map((v) => String(v).trim()).filter(Boolean);
      if (arr.length === 0) return;

      //멀티 필터는 CSV로 한 번만 보내는 걸로 수정(genres=crime,mystery,horror)
      if (CSV_KEYS.has(key)) {
        sp.set(key, arr.join(","));
      } else {
        // 기존 방식 유지
        arr.forEach((v) => sp.append(key, v));
      }
      return;
    }

    const str = String(value);
    if (str.length === 0) return;
    sp.set(key, str);
  });

  return sp.toString();
};

/**
 * 시나리오 목록 조회 (GET /api/scenarios)
 * @param {Object} [params]
 * @param {string} [params.keyword]
 * @param {string[]} [params.genres]
 * @param {string[]} [params.difficulties]
 * @param {string} [params.sortBy] - latest|popular|rating
 * @param {number} [params.page] - 0-base
 * @param {number} [params.size]
 * @returns {Promise<ScenarioListResponse>}
 * @throws {ApiError}
 */
export const fetchScenarios = async (params = {}) => {
  try {
    const response = await apiClient.get(ENDPOINTS.scenarios.list, {
      params,
      paramsSerializer,
    });
    return response.data;
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error);
    }
    throw new ApiError("시나리오 목록을 불러오는데 실패했습니다.");
  }
};

/**
 * 평점 TOP 10 (GET /api/scenarios/top/rating)
 * @returns {Promise<any>}
 * @throws {ApiError}
 */
export const fetchTopScenariosByRating = async () => {
  try {
    const response = await apiClient.get(ENDPOINTS.scenarios.topByRating);
    return response.data;
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error);
    }
    throw new ApiError("TOP 시나리오(평점) 조회에 실패했습니다.");
  }
};

/**
 * 플레이수 TOP 10 (GET /api/scenarios/top/play-count)
 * @returns {Promise<any>}
 * @throws {ApiError}
 */
export const fetchTopScenariosByPlayCount = async () => {
  try {
    const response = await apiClient.get(ENDPOINTS.scenarios.topByPlayCount);
    return response.data;
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error);
    }
    throw new ApiError("TOP 시나리오(플레이수) 조회에 실패했습니다.");
  }
};

/**
 * 시나리오 상세 조회 (GET /api/scenarios/{scenarioId})
 * @param {number} scenarioId
 * @returns {Promise<ScenarioDetailResponse>}
 * @throws {ApiError}
 */
export const fetchScenarioDetail = async (scenarioId) => {
  try {
    const response = await apiClient.get(
      ENDPOINTS.scenarios.detail(scenarioId),
    );
    return response.data;
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error);
    }
    throw new ApiError("시나리오 상세 정보를 불러오는데 실패했습니다.");
  }
};

/**
 * 시나리오 용의자 목록 조회 (GET /api/scenarios/{scenarioId}/suspects)
 * @param {number} scenarioId
 * @returns {Promise<SuspectListResponse>}
 * @throws {ApiError}
 */
export const fetchScenarioSuspects = async (scenarioId) => {
  try {
    const response = await apiClient.get(
      ENDPOINTS.scenarios.suspects(scenarioId),
    );
    return response.data;
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error);
    }
    throw new ApiError("용의자 목록을 불러오는데 실패했습니다.");
  }
};

/**
 * 시나리오 피해자 정보 조회 (GET /api/scenarios/{scenarioId}/victim)
 * @param {number} scenarioId
 * @returns {Promise<VictimResponse>}
 * @throws {ApiError}
 */
export const fetchScenarioVictim = async (scenarioId) => {
  try {
    const response = await apiClient.get(
      ENDPOINTS.scenarios.victim(scenarioId),
    );
    return response.data;
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error);
    }
    throw new ApiError("피해자 정보를 불러오는데 실패했습니다.");
  }
};

/**
 * 시나리오 방 정보 조회 (GET /api/scenarios/{scenarioId}/rooms)
 * @param {number} scenarioId
 * @returns {Promise<RoomListResponse>}
 * @throws {ApiError}
 */
export const fetchScenarioRooms = async (scenarioId) => {
  try {
    const response = await apiClient.get(ENDPOINTS.scenarios.rooms(scenarioId));
    return response.data;
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error);
    }
    throw new ApiError("방 정보를 불러오는데 실패했습니다.");
  }
};

/**
 * 시나리오 랭킹 조회 (GET /api/scenarios/{scenarioId}/rankings)
 * @param {number} scenarioId
 * @returns {Promise<ScenarioRankingResponse>}
 * @throws {ApiError}
 */
export const fetchScenarioRankings = async (scenarioId) => {
  try {
    const response = await apiClient.get(
      ENDPOINTS.scenarios.rankings(scenarioId),
    );
    return response.data;
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error);
    }
    throw new ApiError("시나리오 랭킹을 불러오는데 실패했습니다.");
  }
};

/**
 * 시나리오 생성 상태 조회 (GET /api/scenarios/{scenarioId}/status)
 * @param {number} scenarioId
 * @returns {Promise<ScenarioStatusResponse>}
 * @throws {ApiError}
 */
export const fetchScenarioStatus = async (scenarioId) => {
  try {
    const response = await apiClient.get(
      ENDPOINTS.scenarios.status(scenarioId),
    );
    return response.data;
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error);
    }
    throw new ApiError("시나리오 생성 상태를 불러오는데 실패했습니다.");
  }
};

/**
 * 시나리오 생성 요청 (POST /api/scenarios)
 * @param {ScenarioCreateRequest} data
 * @returns {Promise<ScenarioCreateResponse>}
 * @throws {ApiError}
 */
export const createScenario = async (data) => {
  try {
    const response = await apiClient.post(ENDPOINTS.scenarios.create, data);
    return response.data;
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error);
    }
    throw new ApiError("시나리오 생성에 실패했습니다.");
  }
};

/**
 * 시나리오 생성 v2 (POST /api/v2/scenarios)
 * - v2는 진행 상황을 SSE(/api/v2/scenarios/stream)로 전달
 * @param {Object} data
 * @returns {Promise<any>}
 * @throws {ApiError}
 */
export const createScenarioV2 = async (data) => {
  try {
    const response = await apiClient.post(ENDPOINTS.scenariosV2.create, data);
    return response.data;
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error);
    }
    throw new ApiError("시나리오 생성에 실패했습니다.");
  }
};

/**
 * 시나리오 삭제 (DELETE /api/scenarios/{scenarioId})
 * @param {number} scenarioId
 * @returns {Promise<ScenarioDeleteResponse>}
 * @throws {ApiError}
 */
export const deleteScenario = async (scenarioId) => {
  try {
    const response = await apiClient.delete(
      ENDPOINTS.scenarios.delete(scenarioId),
    );
    return response.data;
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error);
    }
    throw new ApiError("시나리오 삭제에 실패했습니다.");
  }
};

export default {
  fetchScenarios,
  fetchTopScenariosByRating,
  fetchTopScenariosByPlayCount,
  fetchScenarioDetail,
  fetchScenarioSuspects,
  fetchScenarioVictim,
  fetchScenarioRooms,
  fetchScenarioRankings,
  fetchScenarioStatus,
  createScenario,
  createScenarioV2,
  deleteScenario,
};

import { apiClient } from '@/api/client/axios'
import { ENDPOINTS } from '@/api/endpoints'
import { ApiError } from '@/api/errors/ApiError'

/**
 * Scenario API Module
 * OpenAPI spec 기반으로 작성됨
 */

/**
 * 시나리오 목록 조회 (GET /api/scenarios)
 * @returns {Promise<ScenarioListResponse>}
 * @throws {ApiError}
 */
export const fetchScenarios = async () => {
  try {
    const response = await apiClient.get(ENDPOINTS.scenarios.list)
    return response.data
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error)
    }
    throw new ApiError('시나리오 목록을 불러오는데 실패했습니다.')
  }
}

/**
 * 시나리오 검색 (GET /api/scenarios/search?keyword=)
 * @param {string} keyword - 검색 키워드
 * @returns {Promise<ScenarioListResponse>}
 * @throws {ApiError}
 */
export const searchScenarios = async (keyword) => {
  try {
    const response = await apiClient.get(ENDPOINTS.scenarios.search, {
      params: keyword ? { keyword } : {},
    })
    return response.data
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error)
    }
    throw new ApiError('시나리오 검색에 실패했습니다.')
  }
}

/**
 * 시나리오 상세 조회 (GET /api/scenarios/{scenarioId})
 * @param {number} scenarioId
 * @returns {Promise<ScenarioDetailResponse>}
 * @throws {ApiError}
 */
export const fetchScenarioDetail = async (scenarioId) => {
  try {
    const response = await apiClient.get(ENDPOINTS.scenarios.detail(scenarioId))
    return response.data
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error)
    }
    throw new ApiError('시나리오 상세 정보를 불러오는데 실패했습니다.')
  }
}

/**
 * 시나리오 용의자 목록 조회 (GET /api/scenarios/{scenarioId}/suspects)
 * @param {number} scenarioId
 * @returns {Promise<SuspectListResponse>}
 * @throws {ApiError}
 */
export const fetchScenarioSuspects = async (scenarioId) => {
  try {
    const response = await apiClient.get(ENDPOINTS.scenarios.suspects(scenarioId))
    return response.data
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error)
    }
    throw new ApiError('용의자 목록을 불러오는데 실패했습니다.')
  }
}

/**
 * 시나리오 피해자 정보 조회 (GET /api/scenarios/{scenarioId}/victim)
 * @param {number} scenarioId
 * @returns {Promise<VictimResponse>}
 * @throws {ApiError}
 */
export const fetchScenarioVictim = async (scenarioId) => {
  try {
    const response = await apiClient.get(ENDPOINTS.scenarios.victim(scenarioId))
    return response.data
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error)
    }
    throw new ApiError('피해자 정보를 불러오는데 실패했습니다.')
  }
}

/**
 * 시나리오 방 정보 조회 (GET /api/scenarios/{scenarioId}/rooms)
 * @param {number} scenarioId
 * @returns {Promise<RoomListResponse>}
 * @throws {ApiError}
 */
export const fetchScenarioRooms = async (scenarioId) => {
  try {
    const response = await apiClient.get(ENDPOINTS.scenarios.rooms(scenarioId))
    return response.data
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error)
    }
    throw new ApiError('방 정보를 불러오는데 실패했습니다.')
  }
}

/**
 * 시나리오 랭킹 조회 (GET /api/scenarios/{scenarioId}/rankings)
 * @param {number} scenarioId
 * @returns {Promise<ScenarioRankingResponse>}
 * @throws {ApiError}
 */
export const fetchScenarioRankings = async (scenarioId) => {
  try {
    const response = await apiClient.get(ENDPOINTS.scenarios.rankings(scenarioId))
    return response.data
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error)
    }
    throw new ApiError('시나리오 랭킹을 불러오는데 실패했습니다.')
  }
}

/**
 * 시나리오 생성 상태 조회 (GET /api/scenarios/{scenarioId}/status)
 * @param {number} scenarioId
 * @returns {Promise<ScenarioStatusResponse>}
 * @throws {ApiError}
 */
export const fetchScenarioStatus = async (scenarioId) => {
  try {
    const response = await apiClient.get(ENDPOINTS.scenarios.status(scenarioId))
    return response.data
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error)
    }
    throw new ApiError('시나리오 생성 상태를 불러오는데 실패했습니다.')
  }
}

/**
 * 시나리오 생성 요청 (POST /api/scenarios)
 * @param {ScenarioCreateRequest} data
 * @returns {Promise<ScenarioCreateResponse>}
 * @throws {ApiError}
 */
export const createScenario = async (data) => {
  try {
    const response = await apiClient.post(ENDPOINTS.scenarios.create, data)
    return response.data
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error)
    }
    throw new ApiError('시나리오 생성에 실패했습니다.')
  }
}

/**
 * 시나리오 삭제 (DELETE /api/scenarios/{scenarioId})
 * @param {number} scenarioId
 * @returns {Promise<ScenarioDeleteResponse>}
 * @throws {ApiError}
 */
export const deleteScenario = async (scenarioId) => {
  try {
    const response = await apiClient.delete(ENDPOINTS.scenarios.delete(scenarioId))
    return response.data
  } catch (error) {
    if (error.response?.data) {
      throw ApiError.fromAxiosError(error)
    }
    throw new ApiError('시나리오 삭제에 실패했습니다.')
  }
}

export default {
  fetchScenarios,
  searchScenarios,
  fetchScenarioDetail,
  fetchScenarioSuspects,
  fetchScenarioVictim,
  fetchScenarioRooms,
  fetchScenarioRankings,
  fetchScenarioStatus,
  createScenario,
  deleteScenario,
}

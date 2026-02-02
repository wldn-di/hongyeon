import { apiClient } from "@/api/client/axios";
import { ENDPOINTS } from "@/api/endpoints";
import { ApiError } from "@/api/errors/ApiError";

/**
 * 전체 랭킹 조회 (GET /api/rankings?type=score|clears|time)
 * @param {'score'|'clears'|'time'} type
 * @returns {Promise<GlobalRankingResponse>}
 * @throws {ApiError}
 */
export const fetchGlobalRankings = async (type = "score") => {
  try {
    const response = await apiClient.get(ENDPOINTS.rankings, {
      params: { type },
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  } catch (error) {
    if (error.response?.data) throw ApiError.fromAxiosError(error);
    throw new ApiError("랭킹 데이터를 불러오는데 실패했습니다.");
  }
};

/**
 * 내 랭킹 조회 (GET /api/rankings/me?type=score|clears|time)
 * - 401이면(비로그인) 화면에서 null 처리하는 게 UX적으로 좋음
 * @param {'score'|'clears'|'time'} type
 * @returns {Promise<MyRankingResponse>}
 * @throws {ApiError}
 */
export const fetchMyRankings = async (type = "score") => {
  try {
    const response = await apiClient.get(ENDPOINTS.myRankings, {
      params: { type },
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  } catch (error) {
    // 비로그인은 조용히 null로 처리하고 싶으면 여기서 return null로 바꿔도 됨
    if (error.response?.data) throw ApiError.fromAxiosError(error);
    throw new ApiError("내 랭킹 데이터를 불러오는데 실패했습니다.");
  }
};

export default {
  fetchGlobalRankings,
  fetchMyRankings,
};

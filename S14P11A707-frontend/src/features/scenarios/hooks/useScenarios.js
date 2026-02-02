import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchScenarios, searchScenarios } from "../api/scenariosApi";
import { mapScenarioListResponseFull } from "../api/scenarioMappers";

/**
 * 시나리오 목록 조회 Hook
 * 서버 사이드 필터/정렬/페이지네이션 지원
 * @param {Object} params
 * @param {string} [params.keyword]
 * @param {string[]} [params.genres]
 * @param {string[]} [params.difficulties]
 * @param {string} [params.sortBy]
 * @param {number} [params.page]
 * @param {number} [params.size]
 * @param {Object} [options]
 * @param {boolean} [options.enabled=true]
 * @returns {Object} { scenarios, loading, error, refetch }
 */
export function useScenarios(params = {}, options = {}) {
  const { enabled = true } = options;

  const safeParams = useMemo(
    () => ({
      keyword: params.keyword || "",
      genres: Array.isArray(params.genres) ? params.genres : [],
      difficulties: Array.isArray(params.difficulties) ? params.difficulties : [],
      sortBy: params.sortBy || "popular",
      page: Number.isFinite(Number(params.page)) ? Number(params.page) : 0,
      size: Number.isFinite(Number(params.size)) ? Number(params.size) : 20,
    }),
    [
      params.keyword,
      params.genres,
      params.difficulties,
      params.sortBy,
      params.page,
      params.size,
    ],
  );

  const [data, setData] = useState({
    scenarios: [],
    totalPages: 0,
    totalElements: 0,
    currentPage: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const response = await fetchScenarios(safeParams);
      const mapped = mapScenarioListResponseFull(response);
      setData({
        scenarios: mapped.content,
        totalPages: mapped.totalPages,
        totalElements: mapped.totalElements,
        currentPage: mapped.currentPage,
      });
    } catch (err) {
      setError(err);
      console.error("useScenarios error:", err);
    } finally {
      setLoading(false);
    }
  }, [enabled, safeParams]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    scenarios: data.scenarios,
    totalPages: data.totalPages,
    totalElements: data.totalElements,
    currentPage: data.currentPage,
    loading,
    error,
    refetch: fetch,
  };
}

/**
 * 시나리오 검색 Hook
 * @param {string} keyword - 검색 키워드
 * @returns {Object} { scenarios, loading, error, search }
 */
export function useScenarioSearch() {
  const [data, setData] = useState({
    scenarios: [],
    totalPages: 0,
    totalElements: 0,
    currentPage: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = async (keyword) => {
    if (!keyword || keyword.trim() === "") {
      setData({
        scenarios: [],
        totalPages: 0,
        totalElements: 0,
        currentPage: 0,
      });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await searchScenarios(keyword.trim());
      const mapped = mapScenarioListResponseFull(response);
      setData({
        scenarios: mapped.content,
        totalPages: mapped.totalPages,
        totalElements: mapped.totalElements,
        currentPage: mapped.currentPage,
      });
    } catch (err) {
      setError(err);
      toast.error("시나리오 검색에 실패했습니다.");
      console.error("useScenarioSearch error:", err);
    } finally {
      setLoading(false);
    }
  };

  return {
    scenarios: data.scenarios,
    loading,
    error,
    search,
  };
}

export default useScenarios;

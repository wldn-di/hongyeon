import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchMyScenarios } from "../../user/api/userApi";
import { isVisibleInMine, mapScenarioListResponseFull } from "../../scenarios/api/scenarioMappers";

/**
 * 내 시나리오 목록 조회 Hook
 * - 서버는 Pageable 기반으로 응답하므로, 프론트에서는 여러 페이지를 합쳐서 사용합니다.
 * @param {Object} [options]
 * @param {boolean} [options.enabled=true]
 * @returns {Object} { scenarios, loading, error, refetch }
 */
export function useMyScenarios(options = {}) {
  const { enabled = true } = options;
  const [data, setData] = useState({
    scenarios: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const pageSize = useMemo(() => 100, []);

  const fetchAllPages = useCallback(async () => {
    const first = await fetchMyScenarios({ page: 0, size: pageSize });
    const firstMapped = mapScenarioListResponseFull(first);

    const totalPages = Math.max(1, Number(firstMapped.totalPages) || 1);
    const merged = [...(firstMapped.content || [])];

    // 안전장치: 무한/대량 요청 방지
    const maxPages = Math.min(totalPages, 20);

    for (let page = 1; page < maxPages; page += 1) {
      const res = await fetchMyScenarios({ page, size: pageSize });
      const mapped = mapScenarioListResponseFull(res);
      merged.push(...(mapped.content || []));
    }

    return merged.filter(isVisibleInMine);
  }, [pageSize]);

  const fetch = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const scenarios = await fetchAllPages();
      setData({ scenarios });
    } catch (err) {
      setError(err);
      // 사용자 인증이 안 된 경우는 silent fail (로그인 유도는 axios interceptor에서 처리)
      if (err?.status !== 401) {
        console.error("useMyScenarios error:", err);
      }
    } finally {
      setLoading(false);
    }
  }, [enabled, fetchAllPages]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    scenarios: data.scenarios,
    loading,
    error,
    refetch: fetch,
  };
}

export default useMyScenarios;

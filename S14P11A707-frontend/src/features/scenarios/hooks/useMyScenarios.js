import { useState, useEffect } from "react";
import { fetchMyScenarios } from "../../user/api/userApi";
import { mapScenarioListResponseFull } from "../../scenarios/api/scenarioMappers";

/**
 * 내 시나리오 목록 조회 Hook
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

  const fetch = async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const response = await fetchMyScenarios();
      const mapped = mapScenarioListResponseFull(response);
      setData({
        scenarios: mapped.content,
      });
    } catch (err) {
      setError(err);
      // 사용자 인증이 안 된 경우는 silent fail (로그인 유도는 다른 곳에서)
      if (err.response?.status !== 401) {
        //toast.error("내 시나리오를 불러오는데 실패했습니다.");
      }
      console.error("useMyScenarios error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, [enabled]);

  return {
    scenarios: data.scenarios,
    loading,
    error,
    refetch: fetch,
  };
}

export default useMyScenarios;

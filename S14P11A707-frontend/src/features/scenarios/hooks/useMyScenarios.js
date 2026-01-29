import { useState, useEffect } from "react";
import { fetchMyScenarios } from "../../user/api/userApi";
import { mapScenarioListResponseFull } from "../../scenarios/api/scenarioMappers";
import { toast } from "sonner";

/**
 * 내 시나리오 목록 조회 Hook
 * @returns {Object} { scenarios, loading, error, refetch }
 */
export function useMyScenarios() {
  const [data, setData] = useState({
    scenarios: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = async () => {
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
      // useMyScenarios.js (개발 중 임시)
      if (err.response?.status === 401) {
        console.warn("내 시나리오 401: 로그인/토큰/쿠키 문제", err);
        toast.error("내 시나리오 조회 401 (인증 필요)"); // 개발 중만
      }
      console.error("useMyScenarios error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  return {
    scenarios: data.scenarios,
    loading,
    error,
    refetch: fetch,
  };
}

export default useMyScenarios;

import { useState, useEffect, useCallback, useRef } from "react";
import { fetchEventLogs } from "../../session/api/logsApi";
import { normalizeEventLogListResponse } from "../../session/api/sessionMappers";
import { toast } from "sonner";

// 백엔드 이벤트 타입을 프론트엔드 타입으로 매핑
const mapEventType = (backendType) => {
  const typeMap = {
    GAME_START: "system",
    CLUE_FOUND: "evidence",
    FLOOR_MOVED: "system",
    INTERROGATION: "interrogation",
    GAME_SAVE: "save",
    GAME_COMPLETE: "system",
  };
  return typeMap[backendType] || "system";
};

// 시간 포맷 함수
const formatTime = (dateStr) => {
  if (!dateStr) return "--:--";
  try {
    return new Date(dateStr).toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "--:--";
  }
};

/**
 * 게임 세션 이벤트 로그 조회 Hook
 * @param {number} sessionId - 세션 ID
 * @returns {Object} { logs, loading, error, addLog, resetLogs, refetch }
 */
export function useGameLogs(sessionId) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // sessionId를 ref로 관리하여 refetch 시 최신 값 사용
  const sessionIdRef = useRef(sessionId);
  const isLoadedRef = useRef(false);  // 로드 중복 방지
  
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  const fetchLogs = useCallback(async (id) => {
    // id가 전달되면 사용, 아니면 ref 값 사용 (refetch용)
    const currentSessionId = id ?? sessionIdRef.current;
    if (!currentSessionId) {
      setLogs([]);
      setLoading(false);
      return;
    }

    // 이미 로드 중이면 스킵 (같은 sessionId에 대해)
    if (isLoadedRef.current && sessionIdRef.current === currentSessionId) {
      console.log('[useGameLogs] 이미 로드됨 - 스킵');
      return;
    }
    
    isLoadedRef.current = true;

    try {
      setLoading(true);
      setError(null);
      const response = await fetchEventLogs(Number(currentSessionId));
      const mapped = normalizeEventLogListResponse(response);

      // 백엔드 로그를 UI 포맷으로 변환
      const formattedLogs = (mapped.logs || []).map((log, idx) => ({
        id: log.id || `log-${idx}-${Date.now()}`,
        type: mapEventType(log.type),
        message: log.message || "",
        time: formatTime(log.createdAt),
      }));

      setLogs(formattedLogs);
    } catch (err) {
      setError(err);
      //toast.error("수사 로그를 불러오는데 실패했습니다.");
      console.error("useGameLogs error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sessionId) {
      fetchLogs(sessionId);
    }
  }, [sessionId, fetchLogs]);

  // sessionId 변경 시 플래그 리셋
  useEffect(() => {
    isLoadedRef.current = false;
  }, [sessionId]);

  // 로컬에 로그 추가 (API 호출 없이)
  const addLog = useCallback((type, message) => {
    const newLog = {
      id: Date.now(),
      type,
      message,
      time: new Date().toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setLogs((prev) => [...prev, newLog]);
  }, []);

  // 로그 초기화
  const resetLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return {
    logs,
    loading,
    error,
    addLog,
    resetLogs,
    refetch: fetchLogs,
  };
}

export default useGameLogs;

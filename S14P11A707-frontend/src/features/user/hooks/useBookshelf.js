import { useState, useEffect } from "react";
import { fetchBookshelfSessions, fetchBookshelfStats } from "../api/userApi";
import {
  mapBookshelfSessionResponse,
  mapBookshelfStatsResponse,
} from "@/features/session/api/sessionMappers";
import { toast } from "sonner";

/**
 * 내 책장 데이터 조회 Hook
 * COMPLETED, PLAYING, FAILED 상태의 모든 세션을 반환
 * @param {Object} [options]
 * @param {boolean} [options.enabled=true]
 * @returns {Object} { sessions, stats, loading, error, refetch }
 */
export function useBookshelf(options = {}) {
  const { enabled = true } = options;
  const [sessions, setSessions] = useState({
    completed: [],
    playing: [],
    failed: [],
  });
  const [stats, setStats] = useState({
    totalAttempts: 0,
    totalClears: 0,
    clearRate: 0,
    sRankCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = async () => {
    if (!enabled) {
      setLoading(false);
      setError(null);
      return;
    }
    try {
      setLoading(true);
      setError(null);

      // 병렬로 세션과 통계 조회
      const [sessionsResponse, statsResponse] = await Promise.all([
        fetchBookshelfSessions(),
        fetchBookshelfStats(),
      ]);

      // 세션 데이터 매핑 및 상태별 분류
      // mapBookshelfSessionResponse 내부에서 이미 mapBookshelfItem을 호출하므로 중복 호출 제거
      const mappedSessions = mapBookshelfSessionResponse(sessionsResponse);
      const items = mappedSessions.content;

      const completed = items.filter((item) => item.status === "COMPLETED");
      const playing = items.filter((item) => item.status === "PLAYING");
      const failed = items.filter((item) => item.status === "FAILED");

      setSessions({ completed, playing, failed });

      // 통계 데이터 매핑
      const mappedStats = mapBookshelfStatsResponse(statsResponse);
      setStats(mappedStats);
    } catch (err) {
      setError(err);
      //toast.error('책장 데이터를 불러오는데 실패했습니다.')
      console.error("useBookshelf error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, [enabled]);

  return {
    // 세션 데이터 (상태별 분류)
    completedSessions: sessions.completed,
    playingSessions: sessions.playing,
    failedSessions: sessions.failed,
    allSessions: [
      ...sessions.completed,
      ...sessions.playing,
      ...sessions.failed,
    ],
    // 통계
    totalAttempts: stats.totalAttempts,
    totalClears: stats.totalClears,
    clearRate: stats.clearRate, // 0.0~1.0 (프론트에서 %로 변환 필요)
    clearRatePercent: Math.round(stats.clearRate * 100), // 퍼센트 값
    sRankCount: stats.sRankCount,
    // 상태
    loading,
    error,
    refetch: fetch,
  };
}

/**
 * 내 책장 통계만 조회하는 Hook
 * @returns {Object} { stats, loading, error, refetch }
 */
export function useBookshelfStats() {
  const [stats, setStats] = useState({
    totalAttempts: 0,
    totalClears: 0,
    clearRate: 0,
    sRankCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchBookshelfStats();
      const mapped = mapBookshelfStatsResponse(response);
      setStats(mapped);
    } catch (err) {
      setError(err);
      toast.error("책장 통계를 불러오는데 실패했습니다.");
      console.error("useBookshelfStats error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  return {
    totalAttempts: stats.totalAttempts,
    totalClears: stats.totalClears,
    clearRate: stats.clearRate,
    clearRatePercent: Math.round(stats.clearRate * 100),
    sRankCount: stats.sRankCount,
    loading,
    error,
    refetch: fetch,
  };
}

export default useBookshelf;

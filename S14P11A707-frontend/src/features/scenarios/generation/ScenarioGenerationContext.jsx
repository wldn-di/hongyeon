import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

import { apiClient } from "@/api/client/axios";
import { fetchScenarioStatus } from "@/features/scenarios/api/scenariosApi";
import { fetchMyScenarios } from "@/features/user/api/userApi";
import { useAuth } from "@/contexts/AuthContext";

const ScenarioGenerationContext = createContext(null);

// 기본은 미사용: bootstrap에서 GENERATING을 발견했을 때만 1회 상태 조회 옵션
const ENABLE_BOOTSTRAP_STATUS_CHECK = false;

const initialState = {
  isScenarioGenerating: false,
  scenarioId: null,
  progress: 0,
  generationMessage: "",
  errorMessage: null,
  stageType: null,
  meta: null,
  sseConnected: false,
};

function getUserId(user) {
  const raw = user?.userId ?? user?.user_id ?? user?.id ?? null;
  const num = Number(raw);
  return Number.isFinite(num) ? num : null;
}

function buildV2StreamUrl(explicitUrl) {
  if (explicitUrl) return explicitUrl;
  const base = apiClient?.defaults?.baseURL || "";
  const trimmed = String(base).replace(/\/$/, "");
  // baseURL이 비어 있으면 상대경로로 연결(프록시/동일 오리진 환경 대응)
  return trimmed ? `${trimmed}/api/v2/scenarios/stream` : "/api/v2/scenarios/stream";
}

function safeJsonParse(data) {
  if (data == null) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

function normalizeMessage(message) {
  if (message == null) return "";
  const str = String(message);
  return str;
}

export function ScenarioGenerationProvider({ children, enabled = true, sseUrl }) {
  const { state: authState } = useAuth();
  const user = authState.user;
  const userId = useMemo(() => getUserId(user), [user]);

  const [, setLocation] = useLocation();

  const [generation, setGeneration] = useState(initialState);

  const eventSourceRef = useRef(null);
  const bootstrappedUserIdRef = useRef(null);

  // 외부(예: 생성 요청)에서 즉시 스냅샷으로 상태 갱신할 수 있게 액션 제공
  const actions = useMemo(
    () => ({
      setGeneratingSnapshot: ({ scenarioId, progress = 0, generationMessage = "" } = {}) => {
        const idNum = Number(scenarioId);
        if (!Number.isFinite(idNum)) return;

        setGeneration((prev) => ({
          ...initialState,
          sseConnected: prev.sseConnected,
          isScenarioGenerating: true,
          scenarioId: idNum,
          progress: Number.isFinite(Number(progress)) ? Number(progress) : 0,
          generationMessage: normalizeMessage(generationMessage),
          errorMessage: null,
        }));
      },
      clearGenerating: () => setGeneration((prev) => ({ ...initialState, sseConnected: prev.sseConnected })),
    }),
    [],
  );

  // 1) 로그인 확인 직후 bootstrap 1회
  useEffect(() => {
    if (!enabled || !userId) {
      bootstrappedUserIdRef.current = null;
      setGeneration(initialState);
      return;
    }

    // 사용자당 1회만 수행
    if (bootstrappedUserIdRef.current === userId) return;
    bootstrappedUserIdRef.current = userId;

    let cancelled = false;

    (async () => {
      try {
        const res = await fetchMyScenarios({ page: 0, size: 20 });
        if (cancelled) return;

        const items = Array.isArray(res?.content) ? res.content : [];
        const generating = items.find((item) => item?.status === "GENERATING");

        if (!generating) {
          setGeneration((prev) => ({ ...initialState, sseConnected: prev.sseConnected }));
          return;
        }

        const scenarioId = Number(generating.id);
        const progress = Number.isFinite(Number(generating.progress)) ? Number(generating.progress) : 0;
        const generationMessage =
          normalizeMessage(generating.generationMessage) || "시나리오 생성 중입니다...";

        setGeneration((prev) => ({
          ...initialState,
          sseConnected: prev.sseConnected,
          isScenarioGenerating: true,
          scenarioId: Number.isFinite(scenarioId) ? scenarioId : null,
          progress,
          generationMessage,
          errorMessage: null,
        }));


        if (ENABLE_BOOTSTRAP_STATUS_CHECK && Number.isFinite(scenarioId)) {
          try {
            const status = await fetchScenarioStatus(scenarioId);
            if (cancelled) return;

            setGeneration((prev) => ({
              ...prev,
              progress: Number.isFinite(Number(status?.progress)) ? Number(status.progress) : prev.progress,
              generationMessage: normalizeMessage(status?.message) || prev.generationMessage,
            }));
          } catch {
            // 단발성 보정 호출 실패는 무시
          }
        }
      } catch (e) {
        // 401 등은 무시(로그인 상태가 정확하지 않거나, 네트워크 오류)
        console.warn("[ScenarioGeneration] bootstrap failed", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, userId]);

  // 2) 전역 SSE 연결 유지 (단일 연결)
  useEffect(() => {
    if (!enabled || !userId) return;

    const url = buildV2StreamUrl(sseUrl);
    const es = new EventSource(url); //일단 표준형태로 
    eventSourceRef.current = es;

    es.addEventListener("open", () => setGeneration((prev) => ({ ...prev, sseConnected: true })));

    const onProgress = (event) => {
      const payload = safeJsonParse(event?.data);
      if (!payload) return;

      const scenarioId = Number(payload.scenarioId);
      if (!Number.isFinite(scenarioId) || scenarioId <= 0) return;

      setGeneration(() => ({
        ...initialState,
        isScenarioGenerating: true,
        scenarioId,
        progress: Number.isFinite(Number(payload.progress)) ? Number(payload.progress) : 0,
        generationMessage: normalizeMessage(payload.message) || "시나리오 생성 중입니다...",
        errorMessage: null,

        stageType: payload.type ?? null,
        meta: payload.data ?? null,
        sseConnected: true,
      }));
    };

    const onComplete = (event) => {
      const payload = safeJsonParse(event?.data);
      const scenarioId = Number(payload?.scenarioId);

      setGeneration((prev) => ({ ...initialState, sseConnected: prev.sseConnected }));

      if (Number.isFinite(scenarioId) && scenarioId > 0) {
        toast.success("시나리오 생성 완료!", {
          action: {
            label: "바로 보기",
            onClick: () => setLocation(`/scenario/${scenarioId}`),
          },
        });
      } else {
        toast.success("시나리오 생성 완료!");
      }
    };

    const onServerErrorEvent = (event) => {
      const payload = safeJsonParse(event?.data);
      const scenarioId = Number(payload?.scenarioId);
      const message = normalizeMessage(payload?.message) || "시나리오 생성에 실패했습니다.";

      setGeneration((prev) => ({
        ...initialState,
        sseConnected: prev.sseConnected,
        scenarioId: Number.isFinite(scenarioId) ? scenarioId : prev.scenarioId,
        errorMessage: message,
      }));

      toast.error(message);
    };

    // connect/ping은 상태 갱신 없이 무시
    const noop = () => {};

    // 서버 이벤트
    es.addEventListener("connect", noop);
    es.addEventListener("ping", noop);
    es.addEventListener("progress", onProgress);
    es.addEventListener("complete", onComplete);

    // 서버에서 event: error 를 보내는 경우 + 연결 오류도 동일 타입으로 옴
    es.addEventListener("error", (event) => {
      // server-sent "error" 이벤트(MessageEvent)는 data를 가진다.
      if (typeof event?.data === "string" && event.data.length > 0) {
        onServerErrorEvent(event);
        return;
      }
      // 연결 오류는 EventSource가 자동 재연결하므로 여기서는 상태만 유지
      setGeneration((prev) => ({ ...prev, sseConnected: false }));
    // EventSource는 자동 재연결하므로 여기서 clearGenerating 같은 건 하지 않음
    });

    return () => {
      try {
        es.close();
      } finally {
        if (eventSourceRef.current === es) eventSourceRef.current = null;
      }
    };
  }, [enabled, userId, sseUrl, setLocation]);

  const value = useMemo(
    () => ({ generation, actions }),
    [generation, actions],
  );

  return (
    <ScenarioGenerationContext.Provider value={value}>
      {children}
    </ScenarioGenerationContext.Provider>
  );
}

export function useScenarioGeneration() {
  const ctx = useContext(ScenarioGenerationContext);
  if (!ctx) {
    throw new Error("useScenarioGeneration must be used within <ScenarioGenerationProvider>");
  }
  return ctx;
}

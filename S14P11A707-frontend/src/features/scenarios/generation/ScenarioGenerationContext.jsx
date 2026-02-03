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

function normalizeScenarioId(raw) {
  const num = Number(raw);
  return Number.isFinite(num) && num > 0 ? num : null;
}

function normalizeStatus(raw) {
  if (raw == null) return null;
  const str = String(raw).trim();
  return str ? str.toUpperCase() : null;
}

function normalizeMessage(message) {
  if (message == null) return "";
  const str = String(message);
  return str;
}

export function ScenarioGenerationProvider({ children, enabled = true, sseUrl }) {
  console.log("[ScenarioGenerationProvider] LOADED FILE VERSION = conditional-close");

  const { state: authState } = useAuth();
  const user = authState.user;
  const userId = useMemo(() => getUserId(user), [user]);

  const [, setLocation] = useLocation();
  const setLocationRef = useRef(setLocation);
  useEffect(() => {
    setLocationRef.current = setLocation;
  }, [setLocation]);

  const [generation, setGeneration] = useState(initialState);

  const eventSourceRef = useRef(null);
  const bootstrappedUserIdRef = useRef(null);
  const statusCheckInFlightRef = useRef(false);

  const sseDebugEnabled =
    import.meta.env.DEV || window?.localStorage?.getItem("debug:sse") === "1";
  const sseLog = (...args) => {
    if (!sseDebugEnabled) return;
    console.log("[SSE]", ...args);
  };
  const sseDebug = (...args) => {
    if (!sseDebugEnabled) return;
    console.debug("[SSE]", ...args);
  };

  // 외부(예: 생성 요청)에서 즉시 스냅샷으로 상태 갱신할 수 있게 액션 제공
  const actions = useMemo(
    () => ({
      setGeneratingSnapshot: ({ scenarioId, progress = 0, generationMessage = "" } = {}) => {
        const idNum = Number(scenarioId);
        if (!Number.isFinite(idNum)) return;

        setGeneration(() => ({
          ...initialState,
          isScenarioGenerating: true,
          scenarioId: idNum,
          progress: Number.isFinite(Number(progress)) ? Number(progress) : 0,
          generationMessage: normalizeMessage(generationMessage),
          errorMessage: null,
        }));
      },
      clearGenerating: () => setGeneration(initialState),
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
          setGeneration(initialState);
          return;
        }

        const scenarioId = Number(generating.id);
        const progress = Number.isFinite(Number(generating.progress)) ? Number(generating.progress) : 0;
        const generationMessage =
          normalizeMessage(generating.generationMessage) || "시나리오 생성 중입니다...";

        setGeneration(() => ({
          ...initialState,
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

  // 2) 시나리오 생성 중에만 SSE 연결 (COMPLETED/FAILED 시 반드시 close)
  useEffect(() => {
    if (!enabled || !userId) return;

    const expectedScenarioId = normalizeScenarioId(generation.scenarioId);
    if (!generation.isScenarioGenerating || !expectedScenarioId) {
      if (eventSourceRef.current) {
        sseLog("cleanup", { reason: "not_generating" });
        try {
          eventSourceRef.current.close();
        } finally {
          eventSourceRef.current = null;
        }
      }
      // 상태값만 정리 (deps에 포함되지 않아 1회만 실행됨)
      setGeneration((prev) => (prev.sseConnected ? { ...prev, sseConnected: false } : prev));
      return;
    }

    const url = buildV2StreamUrl(sseUrl);
    const prev = eventSourceRef.current;
    if (prev) {
      sseLog("cleanup", { reason: "replace_connection" });
      try {
        prev.close();
      } catch {
        // ignore
      } finally {
        if (eventSourceRef.current === prev) eventSourceRef.current = null;
      }
    }

    const es = new EventSource(url);
    eventSourceRef.current = es;
    sseLog("open", { url, scenarioId: expectedScenarioId });

    let closed = false;
    const close = (reason, extra) => {
      if (closed) return;
      closed = true;
      sseLog("closing", { reason, scenarioId: expectedScenarioId, ...extra });
      try {
        es.close();
      } finally {
        if (eventSourceRef.current === es) eventSourceRef.current = null;
      }
    };

    es.addEventListener("open", () => {
      sseLog("open.connected", { scenarioId: expectedScenarioId });
      setGeneration((prevGen) => {
        if (!prevGen?.isScenarioGenerating) return prevGen;
        if (normalizeScenarioId(prevGen.scenarioId) !== expectedScenarioId) return prevGen;
        return { ...prevGen, sseConnected: true };
      });
    });

    const getPayloadScenarioId = (payload) =>
      normalizeScenarioId(payload?.scenarioId ?? payload?.scenario_id ?? payload?.id ?? null);

    const shouldHandlePayload = (payload) => {
      const payloadScenarioId = getPayloadScenarioId(payload);
      // global stream일 수 있으므로 현재 생성 중인 scenarioId만 처리
      if (payloadScenarioId && payloadScenarioId !== expectedScenarioId) return false;
      return true;
    };

    const getPayloadStatus = (payload) =>
      (() => {
        const type = normalizeStatus(payload?.type ?? null);
        if (type === "COMPLETE") return "COMPLETED";
        if (type === "ERROR") return "FAILED";

        return normalizeStatus(
          payload?.status ??
            payload?.scenarioStatus ??
            payload?.scenario_status ??
            payload?.scenarioState ??
            payload?.scenario_state ??
            payload?.state ??
            null,
        );
      })();

    const resolveScenarioIdForToast = (payload) => {
      const payloadScenarioId = getPayloadScenarioId(payload);
      return payloadScenarioId || expectedScenarioId;
    };

    const handleComplete = (payload, { sourceEvent = "complete" } = {}) => {
      if (closed) return;
      if (!shouldHandlePayload(payload)) return;
      close("complete", { sourceEvent });
      const scenarioId = resolveScenarioIdForToast(payload);

      setGeneration({
        ...initialState,
        sseConnected: false,
      });

      toast.success("시나리오 생성 완료!", {
        action: {
          label: "바로 보기",
          onClick: () => setLocationRef.current(`/scenario/${scenarioId}`),
        },
      });
    };

    const handleFail = (payload, { sourceEvent = "error" } = {}) => {
      if (closed) return;
      if (!shouldHandlePayload(payload)) return;
      const message = normalizeMessage(payload?.message) || "시나리오 생성에 실패했습니다.";
      close("failed", { sourceEvent });

      setGeneration({
        ...initialState,
        scenarioId: expectedScenarioId,
        errorMessage: message,
        sseConnected: false,
      });

      toast.error(message);
    };

    const onProgress = (event) => {
      const payload = safeJsonParse(event?.data);
      if (!payload) return;

      if (!shouldHandlePayload(payload)) {
        sseDebug("message.ignored", { event: "progress", payload });
        return;
      }

      const status = getPayloadStatus(payload);
      sseLog("message", {
        event: "progress",
        type: payload?.type ?? null,
        status,
        scenarioId: getPayloadScenarioId(payload),
        progress: payload?.progress ?? null,
      });
      if (status === "COMPLETED") {
        handleComplete(payload, { sourceEvent: "progress.status" });
        return;
      }
      if (status === "FAILED") {
        handleFail(payload, { sourceEvent: "progress.status" });
        return;
      }

      setGeneration(() => ({
        ...initialState,
        isScenarioGenerating: true,
        scenarioId: expectedScenarioId,
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
      sseLog("message", {
        event: "complete",
        status: normalizeStatus(payload?.status) || "COMPLETED",
        scenarioId: getPayloadScenarioId(payload),
      });
      handleComplete(payload, { sourceEvent: "complete.event" });
    };

    const onServerErrorEvent = (event) => {
      const payload = safeJsonParse(event?.data);
      sseLog("message", {
        event: "error",
        status: normalizeStatus(payload?.status) || "FAILED",
        scenarioId: getPayloadScenarioId(payload),
      });
      handleFail(payload, { sourceEvent: "error.event" });
    };

    // connect/ping은 상태 갱신 없이 무시
    const noop = () => {};

    // 서버 이벤트
    es.addEventListener("connect", noop);
    es.addEventListener("ping", noop);
    // 기본 message 이벤트로 status(COMPLETED/FAILED) 등을 보내는 서버 대응
    es.addEventListener("message", (event) => {
      const payload = safeJsonParse(event?.data);
      if (!payload) return;
      if (!shouldHandlePayload(payload)) {
        sseDebug("message.ignored", { event: "message", payload });
        return;
      }

      const status = getPayloadStatus(payload);
      sseLog("message", {
        event: "message",
        type: payload?.type ?? null,
        status,
        scenarioId: getPayloadScenarioId(payload),
        progress: payload?.progress ?? null,
      });
      if (status === "COMPLETED") {
        handleComplete(payload, { sourceEvent: "message.status" });
        return;
      }
      if (status === "FAILED") {
        handleFail(payload, { sourceEvent: "message.status" });
        return;
      }
    });
    es.addEventListener("progress", onProgress);
    es.addEventListener("complete", onComplete);

    // 서버에서 event: error 를 보내는 경우 + 연결 오류도 동일 타입으로 옴
    es.addEventListener("error", (event) => {
      if (closed) return;
      // server-sent "error" 이벤트(MessageEvent)는 data를 가진다.
      if (typeof event?.data === "string" && event.data.length > 0) {
        onServerErrorEvent(event);
        return;
      }
      // 연결 오류: 즉시 실패 처리 금지. 1회 status 조회로 완료/실패 여부 판정.
      sseLog("message", { event: "connection.error", scenarioId: expectedScenarioId });

      setGeneration((prevGen) => {
        if (!prevGen?.isScenarioGenerating) return prevGen;
        if (normalizeScenarioId(prevGen.scenarioId) !== expectedScenarioId) return prevGen;
        return { ...prevGen, sseConnected: false };
      });

      if (statusCheckInFlightRef.current) return;
      statusCheckInFlightRef.current = true;

      (async () => {
        try {
          const statusRes = await fetchScenarioStatus(expectedScenarioId);
          const status = normalizeStatus(
            statusRes?.status ??
              statusRes?.scenarioStatus ??
              statusRes?.scenario_status ??
              statusRes?.state ??
              null,
          );

          sseLog("message", {
            event: "status.check",
            scenarioId: expectedScenarioId,
            status,
            progress: statusRes?.progress ?? null,
          });

          if (status === "COMPLETED") {
            handleComplete({ scenarioId: expectedScenarioId, status: "COMPLETED" }, { sourceEvent: "status.check" });
            return;
          }
          if (status === "FAILED") {
            handleFail(
              { scenarioId: expectedScenarioId, status: "FAILED", message: statusRes?.message ?? null },
              { sourceEvent: "status.check" },
            );
            return;
          }

          // GENERATING이면: 자동 재연결 대기(실패 토스트/상태 초기화 금지)
          setGeneration((prevGen) => {
            if (!prevGen?.isScenarioGenerating) return prevGen;
            if (normalizeScenarioId(prevGen.scenarioId) !== expectedScenarioId) return prevGen;
            const nextProgress = Number(statusRes?.progress);
            return {
              ...prevGen,
              progress: Number.isFinite(nextProgress) ? nextProgress : prevGen.progress,
              generationMessage: normalizeMessage(statusRes?.message) || prevGen.generationMessage,
            };
          });
        } catch (err) {
          sseLog("message", {
            event: "status.check.error",
            scenarioId: expectedScenarioId,
            message: err?.message || String(err),
          });
        } finally {
          statusCheckInFlightRef.current = false;
        }
      })();
    });

    return () => {
      sseLog("cleanup", { reason: "effect_cleanup", scenarioId: expectedScenarioId });
      close("cleanup");
    };
  }, [enabled, userId, sseUrl, generation.isScenarioGenerating, generation.scenarioId]);

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

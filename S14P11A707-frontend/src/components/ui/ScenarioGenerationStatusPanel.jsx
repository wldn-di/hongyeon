import React, { useMemo } from "react";
import { TypewriterText } from "@/components/ui/TypewriterText";
import { useScenarioGeneration } from "@/features/scenarios/generation/ScenarioGenerationContext";

// stage 매핑 (네가 준 문구 1:1)
function buildStageMessage({ stageType, progress, message, meta }) {
  const m = (message ?? "").trim();
  if (m) return m;

  const getNum = (k) => {
    const v = meta?.[k];
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const retry = getNum("retry");
  const maxRetry = getNum("maxRetry") ?? 3;
  const done = getNum("done");
  const total = getNum("total");
  const p = typeof progress === "number" ? progress : 0;

  if (!stageType && p <= 0) return "시나리오 생성 요청 전입니다";

  switch (stageType) {
    case "WAITING":
      return "생성 대기 중이에요. 잠시만 기다려 주세요.";
    case "TIMELINE":
      return "탐정이 사건 개요를 받아 적는 중이에요.";
    case "CHARACTERS_CLUES_TRUTH":
      return "탐정이 증거물들을 검토하고 있어요…";
    case "ROOMS":
      return "현장을 재구성하고 있어요…";
    case "CRITIQUE":
      return "알리바이의 모순을 찾는 중…";
    case "REFINE":
      return `허점을 보강하고 있어요… (재검토 ${retry ?? "?"}/${maxRetry})`;
    case "IMAGE_PROMPT":
      return "증거 사진 촬영 지시서를 작성 중…";
    case "IMAGE_PROGRESS":
      return `증거 사진을 확보 중… (${done ?? "?"}/${total ?? "?"})`;
    case "FINALIZE":
      return "수사 보고서를 마무리하는 중…";
    case "VALIDATE":
      return "단서들의 정합성을 확인 중…";
    case "PERSIST":
      return "사건 기록을 정리 중…";
    default:
      if (p < 20) return "탐정이 사건 개요를 받아 적는 중이에요.";
      if (p < 40) return "탐정이 증거물들을 검토하고 있어요…";
      if (p < 55) return "현장을 재구성하고 있어요…";
      if (p < 65) return "알리바이의 모순을 찾는 중…";
      if (p < 95) return "증거 사진을 확보 중…";
      return "수사 보고서를 마무리하는 중…";
  }
}

export default function ScenarioGenerationStatusPanel({ compact = false }) {
  const { generation } = useScenarioGeneration();
  const locked = !!generation.isScenarioGenerating;
  const hasError = !!generation.errorMessage;

  const msg = useMemo(
    () =>
      buildStageMessage({
        stageType: generation.stageType,
        progress: generation.progress,
        message: generation.errorMessage || generation.generationMessage,
        meta: generation.meta,
      }),
    [generation.stageType, generation.progress, generation.generationMessage, generation.errorMessage, generation.meta]
  );

  if (compact && !locked && !hasError) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white/60">
        새 알림이 없어요.
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-white/10 bg-black/50 ${compact ? "p-3" : "p-4"}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="font-extrabold text-white">
          {locked ? "시나리오 생성 중" : hasError ? "생성 실패" : "상태"}
        </div>
        <div className="text-xs text-white/60">{locked ? `${generation.progress ?? 0}%` : ""}</div>
      </div>

      <div className="mt-2 text-sm text-white/80 min-h-[22px]">
        <TypewriterText text={msg} speed={0.02} />
        <span className="ml-1 inline-block animate-pulse text-white/70">▍</span>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full bg-red-500/80 transition-[width] duration-200"
          style={{ width: `${Math.max(0, Math.min(100, generation.progress ?? 0))}%` }}
        />
      </div>

      {!compact && (
        <div className="mt-2 flex justify-between text-xs text-white/50">
          <span>scenarioId: {generation.scenarioId ?? "-"}</span>
          <span>SSE: {generation.sseConnected ? "connected" : "disconnected"}</span>
        </div>
      )}
    </div>
  );
}

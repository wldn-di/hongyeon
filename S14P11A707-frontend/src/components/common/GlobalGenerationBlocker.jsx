import React from "react";
import { useScenarioGenerationGate } from "@/features/scenarios/realtime/useScenarioGenerationGate";

export default function GlobalGenerationBlocker() {
  const { state } = useScenarioGenerationGate();

  if (!state.locked) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Scenario generation in progress"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "grid",
        placeItems: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.72)",
          backdropFilter: "blur(6px)",
        }}
      />
      <div
        style={{
          position: "relative",
          width: "min(520px, 92vw)",
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(10,10,12,0.92)",
          boxShadow: "0 20px 80px rgba(0,0,0,0.6)",
          padding: 20,
          color: "white",
        }}
      >
        <div style={{ fontSize: 12, letterSpacing: "0.14em", color: "rgba(255,255,255,0.55)" }}>
          SYSTEM LOCK
        </div>

        <div style={{ fontSize: 20, fontWeight: 800, marginTop: 8 }}>
          시나리오 생성 중…
        </div>

        <div style={{ marginTop: 10, fontSize: 14, lineHeight: 1.5, color: "rgba(255,255,255,0.78)" }}>
          다른 시나리오가 생성 중이라 새 시나리오를 만들 수 없습니다.
          완료/실패 처리 후 자동으로 해제됩니다.
        </div>

        <div style={{ marginTop: 12, fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
          {state.message || "진행 상황을 수신 중입니다…"}
        </div>

        <div style={{ marginTop: 14 }}>
          <div
            style={{
              height: 8,
              borderRadius: 999,
              background: "rgba(255,255,255,0.10)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${Math.max(0, Math.min(100, state.progress ?? 0))}%`,
                background: "rgba(239,68,68,0.85)", // red-ish
                transition: "width 240ms ease",
              }}
            />
          </div>

          <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
            <span>scenarioId: {state.scenarioId ?? "-"}</span>
            <span>{state.progress ?? 0}%</span>
          </div>

          <div style={{ marginTop: 6, fontSize: 11, color: "rgba(255,255,255,0.40)" }}>
            SSE: {state.sseConnected ? "connected" : "disconnected"} · last: {state.lastType ?? "-"}
          </div>
        </div>
      </div>
    </div>
  );
}

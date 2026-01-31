import React from "react";
import { useLocation } from "wouter";
import { AppRoutes } from "./routes";
import { Header } from "@/components/layout/Header";
import { Toaster, toast } from "sonner";

import { ScenarioJobProvider, useScenarioJob } from "@/features/scenarios/polling/ScenarioJobContext";
import { useScenarioJobWatcher } from "@/features/scenarios/polling/useScenarioJobWatcher";

/**
 * 시나리오 생성 상태를 저장하고 생성 완료 토스트에 바로 보기 기능
 * Header를 한 번만 렌더링하고 페이지 라우팅을 관리함
 */
function AppShellInner() {
  const [location, setLocation] = useLocation();
  const { setJob } = useScenarioJob();

  // 게임 플레이 화면에서는 헤더 숨기기
  const hideHeader = location.startsWith("/room/") || location.startsWith("/game/") || location.startsWith("/tutorial");

  useScenarioJobWatcher({
    intervalMs: 3000,
    onTick: (res) => setJob(res), // 시나리오 생성 상태 progress/message 저장
    onCompleted: (res) => {
      setJob(null);
      toast.success("시나리오 생성 완료!", {
        action: {
          label: "바로 보기",
          onClick: () => setLocation(`/scenarios/${res.scenarioId}`),
        },
      });
    },
    onFailed: (res) => {
      setJob(null);
      toast.error(`생성 실패: ${res?.errorMessage ?? res?.message ?? "알 수 없는 오류"}`);
    },
  });

  return (
    <div className="dark">
      <Toaster richColors position="top-right" />
      {!hideHeader && <Header />}
      <AppRoutes />
    </div>
  );
}

/**
 * AppShell - 앱의 최상위 컴포넌트
 */
export function AppShell() {
  return (
    <ScenarioJobProvider>
      <AppShellInner />
    </ScenarioJobProvider>
  );
}

import React from "react";
import { useLocation } from "wouter";
import { AppRoutes } from "./routes";
import { Header } from "@/components/layout/Header";
import { Toaster, toast } from "sonner";

// [추가] 턴테이블 컴포넌트 import
import { Turntable } from "@/components/ui/Turntable";
import { Atmosphere } from "@/components/ui/Atmosphere";
import { ScenarioJobProvider, useScenarioJob } from "@/features/scenarios/polling/ScenarioJobContext";
import { useScenarioJobWatcher } from "@/features/scenarios/polling/useScenarioJobWatcher";

function AppShellInner() {
  const [location, setLocation] = useLocation();
  const { setJob } = useScenarioJob();

  // 게임 플레이 화면 등 특정 경로 감지
  const hideHeader = location.startsWith("/room/") || location.startsWith("/game/") || location.startsWith("/tutorial");

  useScenarioJobWatcher({
    intervalMs: 3000,
    onTick: (res) => setJob(res),
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
      <div className="dark min-h-screen relative bg-neutral-950 text-neutral-200">
          <Toaster richColors position="top-right" />


          <Atmosphere />

        {!hideHeader && <Header />}

        <AppRoutes />
        <Turntable />

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
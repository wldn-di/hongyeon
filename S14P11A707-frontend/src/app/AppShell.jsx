import React from "react";
import { useLocation } from "wouter";
import { AppRoutes } from "./routes";
import { Header } from "@/components/layout/Header";
import { Toaster } from "sonner";

import { ScenarioGenerationProvider } from "@/features/scenarios/generation/ScenarioGenerationContext";
import { useAuth } from "@/contexts/AuthContext"; // ✅ 추가

function AppShellInner() {
  const [location] = useLocation();
  const hideHeader =
    location.startsWith("/room/") ||
    location.startsWith("/game/") ||
    location.startsWith("/tutorial");

  return (
    <div className="dark">
      <Toaster richColors position="top-right" />
      {!hideHeader && <Header />}
      <AppRoutes />
    </div>
  );
}

export function AppShell() {
  const { state: auth } = useAuth();
  const enabled = !auth.loading && !!auth.user;

  return (
    <ScenarioGenerationProvider enabled={enabled} sseUrl="/api/v2/scenarios/stream">
      <AppShellInner />
    </ScenarioGenerationProvider>
  );
}

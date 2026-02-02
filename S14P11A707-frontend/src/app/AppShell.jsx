import React from "react";
import { useLocation } from "wouter";
import { AppRoutes } from "./routes";
import { Header } from "@/components/layout/Header";
import { Toaster } from "sonner";

import { ScenarioGenerationProvider } from "@/features/scenarios/generation/ScenarioGenerationContext";
import { useAuth } from "@/contexts/AuthContext"; // ✅ 추가
import { Turntable } from "@/components/ui/Turntable";
import { Atmosphere } from "@/components/ui/Atmosphere";

function AppShellInner() {
    const [location] = useLocation();
    const hideHeader =
        location.startsWith("/room/") ||
        location.startsWith("/game/") ||
        location.startsWith("/tutorial");

    return (
        <div className="dark">
            <Toaster richColors position="top-right" />
            <Atmosphere />
            {!hideHeader && <Header />}
            <AppRoutes />
            <Turntable />
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

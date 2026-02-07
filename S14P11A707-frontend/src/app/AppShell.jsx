import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { AppRoutes } from "./routes";
import { POST_LOGIN_REDIRECT_KEY } from "./routePaths";
import { Header } from "@/components/layout/Header";
import { Toaster } from "sonner";
import { Monitor } from "lucide-react";

import { ScenarioGenerationProvider } from "@/features/scenarios/generation/ScenarioGenerationContext";
import { useAuth } from "@/contexts/AuthContext";
import { Turntable } from "@/components/ui/Turntable";
import { Atmosphere } from "@/components/ui/Atmosphere";
import { AlertModal } from "@/components/ui/AlertModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { LoginGate } from "@/components/ui/LoginGate";

function MobileBlockOverlay() {
    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-[#0a0a0f]">
            <div className="text-center px-8 max-w-sm">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-900/30 border border-amber-700/50 flex items-center justify-center">
                    <Monitor className="w-10 h-10 text-amber-500" />
                </div>
                <h2 className="text-xl font-bold text-amber-100 mb-3" style={{ fontFamily: 'Cinzel, serif' }}>
                    PC 전용 게임
                </h2>
                <p className="text-amber-200/70 text-sm leading-relaxed mb-2">
                    본 게임은 PC에서만 플레이 가능합니다.
                </p>
                <p className="text-amber-200/50 text-xs">
                    PC 브라우저로 재접속해주세요.
                </p>
            </div>
        </div>
    );
}

function AppShellInner() {
    const [location, setLocation] = useLocation();
    const { state: auth } = useAuth();
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
    const hideHeader =
        location.startsWith("/room/") ||
        location.startsWith("/game/") ||
        location.startsWith("/tutorial");

    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener("resize", handler);
        return () => window.removeEventListener("resize", handler);
    }, []);

    useEffect(() => {
        if (typeof window.gtag !== "function") return;

        window.gtag("event", "page_view", {
            page_path: location,
            page_location: window.location.href,
            page_title: document.title,
        });
    }, [location]);

    useEffect(() => {
        if (auth.loading || !auth.user) return;

        let redirectTo = null;
        try {
            redirectTo = window.sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY);
        } catch {
            // ignore
        }

        if (!redirectTo) return;

        try {
            window.sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
        } catch {
            // ignore
        }

        if (
            typeof redirectTo === "string" &&
            redirectTo.startsWith("/") &&
            redirectTo !== location
        ) {
            setLocation(redirectTo);
        }
    }, [auth.loading, auth.user, location, setLocation]);

    if (isMobile) {
        return <MobileBlockOverlay />;
    }

    return (
        <div className="dark">
            <Toaster
                position="top-center"
                toastOptions={{
                    style: {
                        background: 'rgb(17, 24, 39)',
                        border: '1px solid rgb(55, 65, 81)',
                        color: '#f5f5f5',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '400',
                        gap: '12px',
                    },
                }}
                offset="80px"
            />
            <Atmosphere />
            {!hideHeader && <Header />}
            <AppRoutes />
            <Turntable />
            <AlertModal />
            <ConfirmModal />
            <LoginGate />
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

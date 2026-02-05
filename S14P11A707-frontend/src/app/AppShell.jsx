import React, { useEffect } from "react";
import { useLocation } from "wouter";
import { AppRoutes } from "./routes";
import { Header } from "@/components/layout/Header";
import { Toaster } from "sonner";

import { ScenarioGenerationProvider } from "@/features/scenarios/generation/ScenarioGenerationContext";
import { useAuth } from "@/contexts/AuthContext"; // ✅ 추가
import { Turntable } from "@/components/ui/Turntable";
import { Atmosphere } from "@/components/ui/Atmosphere";
import { AlertModal } from "@/components/ui/AlertModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { LoginRequiredModal } from "@/components/ui/LoginRequiredModal";

const POST_LOGIN_REDIRECT_KEY = "post_login_redirect";

function AppShellInner() {
    const [location, setLocation] = useLocation();
    const { state: auth } = useAuth();
    const hideHeader =
        location.startsWith("/room/") ||
        location.startsWith("/game/") ||
        location.startsWith("/tutorial");

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
            <LoginRequiredModal />
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

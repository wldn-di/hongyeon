import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

import { useScenarioGeneration } from "@/features/scenarios/generation/ScenarioGenerationContext";
import ScenarioGenerationStatusPanel from "@/components/ui/ScenarioGenerationStatusPanel";

export default function NotificationBell() {
  const { generation } = useScenarioGeneration();
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  // ESC로 닫기
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // 드로어 오픈/클로즈 애니메이션
  useGSAP(() => {
    const el = panelRef.current;
    if (!el) return;

    if (open) {
      gsap.fromTo(
        el,
        { opacity: 0, y: -8, filter: "blur(6px)", pointerEvents: "none" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          pointerEvents: "auto",
          duration: 0.22,
          ease: "power2.out",
        }
      );
    } else {
      gsap.to(el, {
        opacity: 0,
        y: -6,
        filter: "blur(6px)",
        duration: 0.18,
        ease: "power2.in",
      });
    }
  }, [open]);

  const showDot = generation.isScenarioGenerating;

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(20,20,24,0.8)",
          color: "white",
          cursor: "pointer",
          display: "grid",
          placeItems: "center",
        }}
      >
        <span style={{ fontSize: 18 }}>🔔</span>

        {showDot && (
          <span
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              width: 10,
              height: 10,
              borderRadius: 999,
              background: "rgba(239,68,68,0.95)",
              boxShadow: "0 0 0 2px rgba(20,20,24,1)",
            }}
          />
        )}
      </button>

      {/* Drawer */}
      <div
        ref={panelRef}
        role="dialog"
        aria-label="Notification drawer"
        style={{
          position: "absolute",
          top: 48,
          right: 0,
          width: 360,
          maxWidth: "86vw",
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(10,10,12,0.95)",
          boxShadow: "0 20px 80px rgba(0,0,0,0.55)",
          padding: 12,
          zIndex: 2000,
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: 8,
          }}
        >
          <div style={{ fontWeight: 900, color: "white" }}>알림</div>
          <button
            onClick={() => setOpen(false)}
            style={{
              border: "none",
              background: "transparent",
              color: "rgba(255,255,255,0.7)",
              cursor: "pointer",
              fontSize: 18,
            }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div style={{ padding: 8 }}>
          <ScenarioGenerationStatusPanel compact />
        </div>
      </div>
    </div>
  );
}
